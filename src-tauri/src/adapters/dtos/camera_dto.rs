use crate::shared::types::CameraType;
use serde::Deserialize;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

/// Input DTO from frontend - no metadata required
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct CameraDTO {
    pub id: Option<String>,
    pub camera_type: CameraType,
    pub name: String,
    pub address: String,
}

impl CameraDTO {
    /// Convert to CameraEntity with device_id only
    /// Timestamps and version will be set by repository layer
    pub fn into_entity(
        self,
        device_id: String,
    ) -> crate::domain::entities::camera_entity::CameraEntity {
        use crate::domain::entities::camera_entity::CameraEntity;

        CameraEntity {
            id: self.id,
            device_id,
            camera_type: self.camera_type,
            name: self.name,
            address: self.address,
            // Metadata will be set by repository
            created_at: String::new(),
            updated_at: String::new(),
            deleted_at: None,
            version: 0,
        }
    }
}

// impl From<CameraEntity> for CameraDTO {
//     fn from(entity: CameraEntity) -> Self {
//         Self {
//             id: entity.id,
//             camera_type: entity.camera_type,
//             name: entity.name,
//             address: entity.address,
//         }
//     }
// }

// impl From<CameraDTO> for CameraEntity {
//     fn from(dto: CameraDTO) -> Self {
//         Self {
//             id: dto.id,
//             camera_type: dto.camera_type,
//             name: dto.name,
//             address: dto.address,
//         }
//     }
// }
