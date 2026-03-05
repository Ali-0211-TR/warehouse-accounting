use serde::Deserialize;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::ClientType;

/// Input DTO from frontend - no device_id or metadata required
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct ClientDTO {
    pub id: Option<String>,
    pub client_type: ClientType,
    pub name: String,
    pub name_short: String,
    pub document_code: Option<String>,
    pub address: Option<String>,
    pub tax_code: Option<String>,
    pub bank: Option<String>,
    pub contact: Option<String>,
    pub login: String,
    pub password: String,
}

impl ClientDTO {
    /// Convert to ClientEntity with device_id only
    /// Timestamps and version will be set by repository layer
    pub fn into_entity(
        self,
        device_id: String,
    ) -> crate::domain::entities::client_entity::ClientEntity {
        use crate::domain::entities::client_entity::ClientEntity;

        ClientEntity {
            id: self.id,
            device_id,
            client_type: self.client_type,
            name: self.name,
            name_short: self.name_short,
            document_code: self.document_code,
            address: self.address,
            tax_code: self.tax_code,
            bank: self.bank,
            contact: self.contact,
            login: self.login,
            password: self.password,
            // Metadata will be set by repository
            created_at: String::new(),
            updated_at: String::new(),
            deleted_at: None,
            version: 0,
            // Relations will be populated by repository
            cards: None,
        }
    }
}
