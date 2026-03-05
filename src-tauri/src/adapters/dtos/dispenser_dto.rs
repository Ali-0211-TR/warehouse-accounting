use crate::domain::entities::dispenser_entity::DispenserEntity;
use crate::shared::types::{DispenserFuelingState, DispenserState};
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct DispenserDTO {
    pub id: Option<String>,
    pub name: String,
    pub base_address: u8,
    pub port_id: String,
    pub camera_id: Option<String>,
    pub state: DispenserState,
}

impl DispenserDTO {
    pub fn into_entity(self, device_id: String) -> DispenserEntity {
        DispenserEntity {
            id: self.id,
            device_id,
            name: self.name,
            base_address: self.base_address,
            port_id: self.port_id,
            port: None,
            camera_id: self.camera_id,
            camera: None,
            nozzles: vec![],
            selected_nozzle_id: None,
            fueling_state: DispenserFuelingState::default(),
            state: self.state,
            error: None,
            created_at: String::new(),
            updated_at: String::new(),
            deleted_at: None,
            version: 0,
        }
    }
}

// impl From<DispenserEntity> for DispenserDTO {
//     fn from(entity: DispenserEntity) -> Self {
//         Self {
//             id: entity.id,
//             name: entity.name,
//             base_address: entity.base_address,
//             port: entity.port,
//             camera: entity.camera,
//             nozzles: entity.nozzles,
//             selected_nozzle_id: entity.selected_nozzle_id,
//             fueling_state: entity.fueling_state,
//             state: entity.state,
//         }
//     }
// }

// impl From<DispenserDTO> for DispenserEntity {
//     fn from(dto: DispenserDTO) -> Self {
//         Self {
//             id: dto.id,
//             name: dto.name,
//             base_address: dto.base_address,
//             port: dto.port,
//             camera: dto.camera,
//             nozzles: dto.nozzles,
//             selected_nozzle_id: dto.selected_nozzle_id,
//             fueling_state: dto.fueling_state,
//             state: dto.state,
//         }
//     }
// }
