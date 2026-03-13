use crate::shared::types::SortOrder;

pub mod client_repository;
pub mod device_config_repository;
pub mod discount_repository;
pub mod group_repository;
pub mod limit_repository;
pub mod mark_repository;
pub mod order_item_repository;
pub mod order_repository;
pub mod payment_repository;
pub mod photo_repository;
pub mod price_repository;
pub mod product_repository;
pub mod shift_repository;
// pub mod shop_repository; // DELETED - using device_config instead
// pub mod station_repository; // DELETED - using device_config instead
pub mod tax_repository;
pub mod unit_repository;
pub mod user_repository;

impl From<SortOrder> for sea_orm::Order {
    fn from(sort_direction: SortOrder) -> Self {
        match sort_direction {
            SortOrder::Asc => sea_orm::Order::Asc,
            SortOrder::Desc => sea_orm::Order::Desc,
        }
    }
}
