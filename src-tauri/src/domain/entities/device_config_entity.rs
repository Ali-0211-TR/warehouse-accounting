use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

// Domain entity for device configuration
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct DeviceConfigEntity {
    pub id: String,                // Always "singleton"
    pub device_uuid: String,       // Unique permanent ID
    pub device_id: Option<String>, // Server-assigned ID
    pub device_name: String,
    pub device_token: Option<String>,
    pub server_url: Option<String>,
    pub company_name: Option<String>,
    pub company_tax_code: Option<String>,
    pub company_address: Option<String>,
    pub company_phone: Option<String>,
    pub company_email: Option<String>,
    pub company_website: Option<String>,
    pub station_name: Option<String>,   // Denormalized hierarchy
    pub shop_name: Option<String>,      // Denormalized hierarchy
    pub receipt_footer: Option<String>, // Custom footer text
    pub receipt_template_58mm: Option<String>, // Editable template for 58mm receipts
    pub receipt_template_80mm: Option<String>, // Editable template for 80mm receipts
    pub label_template: Option<String>, // Editable template for label printer
    pub qr_code_url: Option<String>,    // URL/data to encode in QR code
    pub logo_path: Option<String>,      // Path to logo image file for thermal printer
    pub last_sync_at: Option<String>,
    pub is_registered: bool,
}

impl Default for DeviceConfigEntity {
    fn default() -> Self {
        Self {
            id: "singleton".to_string(),
            device_uuid: uuid::Uuid::new_v4().to_string(),
            device_id: None,
            device_name: "".to_string(),
            device_token: None,
            server_url: None,
            company_name: None,
            company_tax_code: None,
            company_address: None,
            company_phone: None,
            company_email: None,
            company_website: None,
            station_name: None,
            shop_name: None,
            receipt_footer: Some("Thank you for your purchase!".to_string()),
            receipt_template_58mm: Some(
                include_str!("../../../assets/templates/receipt_58mm.txt").to_string(),
            ),
            receipt_template_80mm: Some(
                include_str!("../../../assets/templates/receipt_80mm.txt").to_string(),
            ),
            label_template: Some(include_str!("../../../assets/templates/label.txt").to_string()),
            qr_code_url: None,
            logo_path: None,
            last_sync_at: None,
            is_registered: false,
        }
    }
}
