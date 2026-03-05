pub mod dispenser_ops;
use crate::{
    domain::entities::{
        device_config_entity::DeviceConfigEntity, dispenser_entity::DispenserEntity,
        order_entity::OrderEntity, shift_entity::ShiftEntity, user_entity::UserEntity,
    },
    infrastructure::{
        database::model_store::DataStore,
        dispenser_serial::dispenser_port_manager::DispenserPortManager,
    },
    shared::error::Result,
};
use dashmap::DashMap;

use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::Instant,
};
use tauri::{AppHandle, Emitter, Manager, Wry};

use super::{
    event::HubEvent,
    types::{CommRequest, RoleType},
};

pub struct Ctx {
    dispensers: Arc<DashMap<String, DispenserEntity>>,
    address_to_dispenser: Arc<Mutex<HashMap<u8, String>>>,
    nozzle_id_to_dispenser: Arc<Mutex<HashMap<String, String>>>,

    pub active_orders: Arc<Mutex<Vec<OrderEntity>>>,
    dispatcher: Arc<Mutex<DispenserPortManager>>,
    pub user: Arc<Mutex<Option<UserEntity>>>,
    pub active_shift: Arc<Mutex<Option<ShiftEntity>>>,
    model_manager: Arc<DataStore>,
    app_handle: AppHandle<Wry>,

    // Communication tracking
    dispenser_last_comm: Arc<Mutex<HashMap<String, Instant>>>,

    // Device configuration cache
    device_config: Arc<Mutex<Option<DeviceConfigEntity>>>,
}

impl Ctx {
    pub fn new(app_handle: AppHandle<Wry>) -> Self {
        Ctx {
            active_orders: (*app_handle.state::<Arc<Mutex<Vec<OrderEntity>>>>()).clone(),
            dispensers: (*app_handle.state::<Arc<DashMap<String, DispenserEntity>>>()).clone(),
            user: (*app_handle.state::<Arc<Mutex<Option<UserEntity>>>>()).clone(),
            active_shift: (*app_handle.state::<Arc<Mutex<Option<ShiftEntity>>>>()).clone(),
            address_to_dispenser: (*app_handle.state::<Arc<Mutex<HashMap<u8, String>>>>()).clone(),
            nozzle_id_to_dispenser: (*app_handle.state::<Arc<Mutex<HashMap<String, String>>>>())
                .clone(),
            dispatcher: (*app_handle.state::<Arc<Mutex<DispenserPortManager>>>()).clone(),
            model_manager: (*app_handle.state::<Arc<DataStore>>()).clone(),
            app_handle,

            dispenser_last_comm: Arc::new(Mutex::new(HashMap::new())),
            device_config: Arc::new(Mutex::new(None)),
        }
    }

    pub fn from_app(app: AppHandle<Wry>) -> Result<Arc<Ctx>> {
        Ok(Arc::new(Ctx::new(app)))
    }

    pub fn set_user(&self, user: Option<UserEntity>) {
        *self.user.lock().unwrap() = user;
    }

    pub fn get_user(&self) -> Option<UserEntity> {
        let user_lock = self.user.lock().unwrap().clone();
        user_lock
    }

    pub fn send_cmd_to_disp(&self, cmd: CommRequest) {
        let _ = self.dispatcher.lock().unwrap().send_cmd(cmd);
    }

    pub fn emit_hub_event(&self, hub_event: HubEvent) {
        let _ = self.app_handle.emit("HubEvent", hub_event);
    }

    pub fn get_db(&self) -> Arc<DataStore> {
        self.model_manager.clone()
    }

    /// Get device_id from cached device config or load it
    pub async fn get_device_id(&self) -> Result<String> {
        use crate::domain::repositories::DeviceConfigRepository;

        // Check cache first
        {
            let cache = self.device_config.lock().unwrap();
            if let Some(config) = cache.as_ref() {
                if let Some(device_id) = &config.device_id {
                    return Ok(device_id.clone());
                }
                // If no device_id but have uuid, use uuid
                return Ok(config.device_uuid.clone());
            }
        }

        // Load from database and cache
        let config = DeviceConfigRepository::get(self.get_db()).await?;
        let device_id = config
            .device_id
            .clone()
            .unwrap_or_else(|| config.device_uuid.clone());

        // Update cache
        *self.device_config.lock().unwrap() = Some(config);

        Ok(device_id)
    }

    /// Invalidate the device config cache (call after updates)
    pub fn invalidate_device_config_cache(&self) {
        *self.device_config.lock().unwrap() = None;
    }

    // Communication tracking methods
    pub fn mark_dispenser_communication(&self, address: u8) {
        let now = Instant::now();

        {
            let address_map = self.address_to_dispenser.lock().unwrap();
            if let Some(dispenser_id) = address_map.get(&address) {
                let mut last_comm = self.dispenser_last_comm.lock().unwrap();
                last_comm.insert(dispenser_id.clone(), now);
                // Optional: Uncomment for debugging
                // println!("✅ Marked communication for address {} -> dispenser {}", address, dispenser_id);
            } else {
                // Log when address mapping is not found (helpful for debugging)
                println!(
                    "⚠️ WARNING: No dispenser mapping found for address {}. Available addresses: {:?}",
                    address,
                    address_map.keys().collect::<Vec<_>>()
                );
            }
        }
    }

    pub fn send_dispenser_status_updates(&self, timeout_duration: std::time::Duration) {
        let now = Instant::now();

        // Process dispensers directly without intermediate collection
        if let Ok(last_comm) = self.dispenser_last_comm.lock() {
            for (dispenser_id, &last_time) in last_comm.iter() {
                let is_online = now.duration_since(last_time) <= timeout_duration;

                // Get the dispenser to access its base_address
                if let Some(dispenser) = self.dispensers.get(dispenser_id) {
                    let base_address = dispenser.base_address as i32;

                    // println!("🔄 Emitting DispenserCommStatus: base_address={}, is_online={}", base_address, is_online);

                    self.emit_hub_event(HubEvent::DispenserCommStatus {
                        dispenser_id: base_address,
                        is_online,
                    });
                }
            }
        }
    }

    pub async fn start_communication_watchdog(ctx: Arc<Ctx>) {
        let timeout_duration = std::time::Duration::from_secs(5); // 5 second timeout
        let update_interval = std::time::Duration::from_secs(5); // Send updates every 5 seconds

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(update_interval);
            loop {
                interval.tick().await;
                ctx.send_dispenser_status_updates(timeout_duration);
            }
        });
    }
}

pub trait Authorisation {
    fn is_logged_in(&self) -> Result<()>;
    fn has_role(&self, role: RoleType) -> Result<()>;
    fn has_any_role(&self, roles: &[RoleType]) -> Result<()>;
}

impl Authorisation for Ctx {
    fn is_logged_in(&self) -> Result<()> {
        if self.get_user().is_none() {
            return Err(crate::Error::NotLoggedIn);
        }
        Ok(())
    }

    fn has_role(&self, role: RoleType) -> Result<()> {
        match self.get_user() {
            Some(user) if user.roles.contains(&role) => Ok(()),
            Some(_) => Err(crate::Error::NotAuthorized),
            None => Err(crate::Error::NotLoggedIn),
        }
    }

    fn has_any_role(&self, roles: &[RoleType]) -> Result<()> {
        match self.get_user() {
            Some(user) if user.roles.iter().any(|r| roles.contains(r)) => Ok(()),
            Some(_) => Err(crate::Error::NotAuthorized),
            None => Err(crate::Error::NotLoggedIn),
        }
    }
}
