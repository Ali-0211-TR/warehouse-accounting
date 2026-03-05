use super::{
    camera_entity::CameraEntity, dispenser_port_entity::DispenserPortEntity,
    nozzle_entity::NozzleEntity,
};
use crate::shared::{
    error::{Error, Result},
    types::{DispenserError, DispenserFuelingState, DispenserState},
};
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct DispenserEntity {
    pub id: Option<String>,
    pub name: String,
    pub base_address: u8,
    pub port_id: String,
    pub port: Option<DispenserPortEntity>,
    pub camera_id: Option<String>,
    pub camera: Option<CameraEntity>,
    pub nozzles: Vec<NozzleEntity>,
    pub selected_nozzle_id: Option<String>,
    pub fueling_state: DispenserFuelingState,
    pub state: DispenserState,
    pub error: Option<DispenserError>,
    pub device_id: String,
    // Sync metadata
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}

impl DispenserEntity {
    pub fn selected_nozzle_mut(&mut self) -> Option<&mut NozzleEntity> {
        if let Some(ref noz_id) = self.selected_nozzle_id {
            self.nozzles
                .iter_mut()
                .find(|noz| noz.id.as_ref() == Some(noz_id))
        } else {
            None
        }
    }
    pub fn selected_nozzle(&self) -> Option<&NozzleEntity> {
        if let Some(ref noz_id) = self.selected_nozzle_id {
            self.nozzles
                .iter()
                .find(|noz| noz.id.as_ref() == Some(noz_id))
        } else {
            None
        }
    }
    pub fn select_nozzle_by_address(&mut self, address: u8) -> Result<()> {
        self.selected_nozzle_id = self
            .nozzles
            .iter()
            .find(|noz| noz.address == address)
            .map(|noz| noz.id.clone())
            .ok_or_else(|| Error::Dispenser("Nozzle not found".to_owned()))?;
        Ok(())
    }
}
