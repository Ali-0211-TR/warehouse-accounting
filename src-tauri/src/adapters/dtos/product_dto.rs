use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::ProductType;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Deserialize)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct AddProductDTO {
    pub order_id: String,
    pub product_id: String,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub count: Decimal,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Deserialize)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct RemoveOrderItemDTO {
    pub order_id: String,
    pub order_item_id: String,
}

/// Input DTO from frontend - no device_id or metadata required
/// This is the ONLY DTO needed for product operations
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct ProductInputDTO {
    pub id: Option<String>,
    pub name: String,
    pub short_name: String,
    pub product_type: ProductType,
    pub unit_id: Option<String>,
    pub bar_code: String,
    pub article: String,
    pub group_id: Option<String>,
    pub discount_ids: Vec<String>,
    pub tax_ids: Vec<String>,
    pub image_paths: Vec<String>,
}

impl ProductInputDTO {
    /// Convert to ProductEntity with device_id only
    /// Timestamps, version, and relations will be set by repository layer
    pub fn into_entity(
        self,
        device_id: String,
    ) -> crate::domain::entities::product_entity::ProductEntity {
        use crate::domain::entities::product_entity::ProductEntity;
        use rust_decimal::Decimal;

        ProductEntity {
            id: self.id,
            device_id,
            name: self.name,
            short_name: self.short_name,
            product_type: self.product_type,
            unit: None, // Will be populated by repository if unit_id is provided
            bar_code: self.bar_code,
            article: self.article,
            balance: Decimal::ZERO, // Will be calculated by repository
            group: None,            // Will be populated by repository if group_id is provided
            prices: Vec::new(),     // Will be loaded by repository
            discounts: Vec::new(),  // Will be set by repository from discount_ids
            taxes: Vec::new(),      // Will be set by repository from tax_ids
            // Virtual computed price fields - will be computed by repository
            sale_price: Decimal::ZERO,
            income_price: Decimal::ZERO,
            outcome_price: Decimal::ZERO,
            // Metadata will be set by repository
            created_at: String::new(),
            updated_at: String::new(),
            deleted_at: None,
            image_paths: self.image_paths,
            version: 0,
        }
    }

    /// Get unit_id for repository operations
    pub fn unit_id(&self) -> Option<String> {
        self.unit_id.clone()
    }

    /// Get group_id for repository operations
    pub fn group_id(&self) -> Option<String> {
        self.group_id.clone()
    }

    /// Get discount_ids for repository operations
    pub fn discount_ids(&self) -> &[String] {
        &self.discount_ids
    }

    /// Get tax_ids for repository operations
    pub fn tax_ids(&self) -> &[String] {
        &self.tax_ids
    }
}

// impl From<ProductEntity> for ProductDTO {
//     fn from(entity: ProductEntity) -> Self {
//         Self {
//             id: entity.id,
//             name: entity.name,
//             short_name: entity.short_name,
//             product_type: entity.product_type,
//             unit_id: entity.unit.and_then(|u| u.id),
//             bar_code: entity.bar_code,
//             article: entity.article,
//             balance: entity.balance,
//             group_id: entity.group.and_then(|g| g.id),
//             discount_ids: entity.discounts.into_iter().filter_map(|d| d.id).collect(),
//             tax_ids: entity.taxes.into_iter().filter_map(|t| t.id).collect(),
//         }
//     }
// }

// impl ProductDTO {
//     pub fn to_entity(self) -> ProductEntity {
//         ProductEntity {
//             id: self.id,
//             name: self.name,
//             short_name: self.short_name,
//             product_type: self.product_type,
//             unit: None, // These will be populated by the repository
//             bar_code: self.bar_code,
//             article: self.article,
//             balance: self.balance,
//             group: None,           // These will be populated by the repository
//             price: Decimal::ZERO,  // Calculated by repository
//             prices: Vec::new(),    // Will be loaded by repository if needed
//             discounts: Vec::new(), // Will be populated by the repository
//             taxes: Vec::new(),     // Will be populated by the repository
//         }
//     }
// }

/// Column enum for sorting products in paginated queries
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub enum ProductColumn {
    Name,
    Article,
    ProductType,
    Balance,
    CreatedAt,
    UpdatedAt,
}

/// Filter for paginated product queries.
/// `active_date_from` / `active_date_to` — when set, returns only products
/// that have at least one order_item within the given period.
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct ProductFilter {
    /// Text search across name / short_name / bar_code / article
    pub search: Option<String>,
    /// Filter by product_type
    pub product_type: Option<ProductType>,
    /// Filter by group_id
    pub group_id: Option<String>,
    /// Only products that participated in orders between these dates.
    /// Both must be set to activate this filter.
    pub active_date_from: Option<String>,
    pub active_date_to: Option<String>,
}
