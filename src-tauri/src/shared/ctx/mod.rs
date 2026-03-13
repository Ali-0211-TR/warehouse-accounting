use crate::{
    domain::entities::{
        device_config_entity::DeviceConfigEntity,
        order_entity::OrderEntity, product_entity::ProductEntity,
        shift_entity::ShiftEntity, user_entity::UserEntity,
    },
    infrastructure::{
        database::model_store::DataStore,
    },
    shared::error::Result,
};

use std::{
    sync::{Arc, Mutex},
};
use tauri::{AppHandle, Emitter, Manager, Wry};

use super::{
    event::HubEvent,
    types::RoleType,
};

pub struct Ctx {
    pub active_orders: Arc<Mutex<Vec<OrderEntity>>>,
    pub user: Arc<Mutex<Option<UserEntity>>>,
    pub active_shift: Arc<Mutex<Option<ShiftEntity>>>,
    model_manager: Arc<DataStore>,
    app_handle: AppHandle<Wry>,

    // Device configuration cache
    device_config: Arc<Mutex<Option<DeviceConfigEntity>>>,
}

impl Ctx {
    pub fn new(app_handle: AppHandle<Wry>) -> Self {
        Ctx {
            active_orders: (*app_handle.state::<Arc<Mutex<Vec<OrderEntity>>>>()).clone(),
            user: (*app_handle.state::<Arc<Mutex<Option<UserEntity>>>>()).clone(),
            active_shift: (*app_handle.state::<Arc<Mutex<Option<ShiftEntity>>>>()).clone(),
            model_manager: (*app_handle.state::<Arc<DataStore>>()).clone(),
            app_handle,

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

    /// Notify frontend about product updates
    pub fn update_product(&self, product: ProductEntity) {
        self.emit_hub_event(HubEvent::ProductUpdated(Box::new(product)));
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
