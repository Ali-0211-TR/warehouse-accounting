use crate::Result;
use crate::adapters::dtos::{
    FuelingSumaryMeta, LazyTableStateDTO, MetaPaginatorDTO, OrderItemMovementSummaryMeta,
};
use crate::domain::entities::fueling_order_entity::{
    FuelingOrderColumn, FuelingOrderEntity, FuelingOrderFilter,
};
use crate::domain::entities::order_item_discount_entity::OrderItemDiscountEntity;
use crate::domain::entities::order_item_entity::{OrderItemColumn, OrderItemFilter};
use crate::domain::entities::order_item_tax_entity::OrderItemTaxEntity;
use crate::domain::repositories::{FuelingOrderRepository, OrderItemRepository};
use crate::domain::{
    entities::order_item_entity::OrderItemEntity, repositories::ProductRepository,
};
use crate::infrastructure::datasources::database::model_store::DataStore;
use crate::shared::error::Error;
use crate::shared::types::OrderType;
use chrono::{DateTime, Utc};
use entity::order_items as oi;
use entity::{fueling_order as foi, order_item_discounts as oid, order_item_taxes as oit};
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait, ActiveValue, DatabaseTransaction, EntityTrait, PaginatorTrait, QueryFilter,
};
use sea_orm::{ColumnTrait, QueryOrder, QuerySelect};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;
use uuid::Uuid;

use super::fueling_order_repository;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct NozzleSummaryData {
    pub nozzle_id: String,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub fo_volume: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub fo_amount: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub oi_volume: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub oi_amount: Decimal,
}

fn tax_model_to_entity(model: oit::Model) -> OrderItemTaxEntity {
    OrderItemTaxEntity {
        id: Some(model.id),
        order_item_id: model.order_item_id,
        name: model.name,
        value: model.value,
        rate: model.rate,
    }
}

fn discount_model_to_entity(model: oid::Model) -> OrderItemDiscountEntity {
    OrderItemDiscountEntity {
        id: Some(model.id),
        order_item_id: model.order_item_id,
        name: model.name,
        value: model.value,
    }
}

pub async fn into_entity(
    db: Arc<DataStore>,
    model: oi::Model,
    fueling_order: Option<FuelingOrderEntity>,
    taxes: Vec<OrderItemTaxEntity>,
    discounts: Vec<OrderItemDiscountEntity>,
) -> Result<OrderItemEntity> {
    let product = ProductRepository::get_by_id(db.clone(), model.product_id)
        .await
        .ok();

    let res = OrderItemEntity {
        id: Some(model.id),
        order_id: model.order_id,
        product,
        contract_product: None,
        count: model.count,
        price: model.price,
        discount: model.discount,
        cost: model.cost,
        tax: model.tax,
        fueling_order,
        discounts,
        taxes,
    };
    Ok(res)
}

/// Build OrderItemEntity from a pre-loaded products map (no DB call per item).
/// Used in batch operations to avoid N+1 queries.
fn into_entity_with_product(
    model: oi::Model,
    fueling_order: Option<FuelingOrderEntity>,
    taxes: Vec<OrderItemTaxEntity>,
    discounts: Vec<OrderItemDiscountEntity>,
    products_map: &HashMap<String, crate::domain::entities::product_entity::ProductEntity>,
) -> OrderItemEntity {
    let product = products_map.get(&model.product_id).cloned();

    OrderItemEntity {
        id: Some(model.id),
        order_id: model.order_id,
        product,
        contract_product: None,
        count: model.count,
        price: model.price,
        discount: model.discount,
        cost: model.cost,
        tax: model.tax,
        fueling_order,
        discounts,
        taxes,
    }
}

impl From<OrderItemEntity> for oi::ActiveModel {
    fn from(entity: OrderItemEntity) -> Self {
        oi::ActiveModel {
            id: entity.id.map_or_else(
                || ActiveValue::Set(Uuid::new_v4().to_string()),
                ActiveValue::Set,
            ),
            order_id: ActiveValue::Set(entity.order_id),
            product_id: ActiveValue::Set(entity.product.and_then(|v| v.id).unwrap_or_default()),
            count: ActiveValue::Set(entity.count),
            price: ActiveValue::Set(entity.price),
            discount: ActiveValue::Set(entity.discount),
            cost: ActiveValue::Set(entity.cost),
            tax: ActiveValue::Set(entity.tax),
            created_at: ActiveValue::Set(Utc::now().to_rfc3339()),
            updated_at: ActiveValue::Set(Utc::now().to_rfc3339()),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(1),
        }
    }
}

impl OrderItemRepository {
    //======Fetching functions==========

    /// Batch: получить order items для списка order_ids
    pub async fn get_orders_items_batch(
        db: Arc<DataStore>,
        order_ids: &[String],
    ) -> Result<HashMap<String, Vec<OrderItemEntity>>> {
        if order_ids.is_empty() {
            return Ok(HashMap::new());
        }

        let db_raw = db.get_db()?;

        // Fetch all order items with their related fueling orders for ALL orders at once
        let orderitems_list = oi::Entity::find()
            .find_also_related(foi::Entity)
            .filter(oi::Column::OrderId.is_in(order_ids.to_vec()))
            .all(db_raw)
            .await?;

        if orderitems_list.is_empty() {
            return Ok(HashMap::new());
        }

        // Extract order item IDs for batch queries
        let order_item_ids: Vec<String> = orderitems_list
            .iter()
            .map(|(oi, _)| oi.id.clone())
            .collect();

        // Batch fetch all taxes for these order items
        let all_taxes = oit::Entity::find()
            .filter(oit::Column::OrderItemId.is_in(order_item_ids.clone()))
            .all(db_raw)
            .await?;

        // Batch fetch all discounts for these order items
        let all_discounts = oid::Entity::find()
            .filter(oid::Column::OrderItemId.is_in(order_item_ids))
            .all(db_raw)
            .await?;

        // Group taxes and discounts by order_item_id
        let mut taxes_by_order_item = HashMap::<String, Vec<OrderItemTaxEntity>>::new();
        for tax in all_taxes {
            let tax_entity = tax_model_to_entity(tax);
            taxes_by_order_item
                .entry(tax_entity.order_item_id.clone())
                .or_default()
                .push(tax_entity);
        }

        let mut discounts_by_order_item = HashMap::<String, Vec<OrderItemDiscountEntity>>::new();
        for discount in all_discounts {
            let discount_entity = discount_model_to_entity(discount);
            discounts_by_order_item
                .entry(discount_entity.order_item_id.clone())
                .or_default()
                .push(discount_entity);
        }

        // Batch load all products for these order items (eliminates N+1)
        let product_ids: Vec<String> = orderitems_list
            .iter()
            .map(|(oi, _)| oi.product_id.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();

        let product_models = entity::products::Entity::find()
            .filter(entity::products::Column::Id.is_in(product_ids))
            .all(db_raw)
            .await?;

        let products_vec =
            super::product_repository::into_entities_batch(db.clone(), product_models).await?;
        let products_map: HashMap<String, crate::domain::entities::product_entity::ProductEntity> =
            products_vec
                .into_iter()
                .filter_map(|p| p.id.clone().map(|id| (id, p)))
                .collect();

        // Build result grouped by order_id
        let mut result = HashMap::<String, Vec<OrderItemEntity>>::new();
        for (order_item, fueling_order) in orderitems_list {
            let order_id = order_item.order_id.clone();
            let fueling_order = fueling_order.map(fueling_order_repository::into_entity);
            let taxes = taxes_by_order_item
                .remove(&order_item.id)
                .unwrap_or_default();
            let discounts = discounts_by_order_item
                .remove(&order_item.id)
                .unwrap_or_default();

            let entity =
                into_entity_with_product(order_item, fueling_order, taxes, discounts, &products_map);
            result.entry(order_id).or_default().push(entity);
        }

        Ok(result)
    }

    pub async fn get_order_items(
        db: Arc<DataStore>,
        order_id: String,
    ) -> Result<Vec<OrderItemEntity>> {
        let db_raw = db.get_db()?;

        // Fetch all order items with their related fueling orders
        let orderitems_list = oi::Entity::find()
            .find_also_related(foi::Entity)
            .filter(oi::Column::OrderId.eq(order_id))
            .all(db_raw)
            .await?;

        if orderitems_list.is_empty() {
            return Ok(vec![]);
        }

        // Extract order item IDs for batch queries
        let order_item_ids: Vec<String> = orderitems_list
            .iter()
            .map(|(oi, _)| oi.id.clone())
            .collect();

        // Batch fetch all taxes for these order items
        let all_taxes = oit::Entity::find()
            .filter(oit::Column::OrderItemId.is_in(order_item_ids.clone()))
            .all(db_raw)
            .await?;

        // Batch fetch all discounts for these order items
        let all_discounts = oid::Entity::find()
            .filter(oid::Column::OrderItemId.is_in(order_item_ids))
            .all(db_raw)
            .await?;

        // Group taxes and discounts by order_item_id for efficient lookup
        let mut taxes_by_order_item =
            std::collections::HashMap::<String, Vec<OrderItemTaxEntity>>::new();
        for tax in all_taxes {
            let tax_entity = tax_model_to_entity(tax);
            taxes_by_order_item
                .entry(tax_entity.order_item_id.clone())
                .or_default()
                .push(tax_entity);
        }

        let mut discounts_by_order_item =
            std::collections::HashMap::<String, Vec<OrderItemDiscountEntity>>::new();
        for discount in all_discounts {
            let discount_entity = discount_model_to_entity(discount);
            discounts_by_order_item
                .entry(discount_entity.order_item_id.clone())
                .or_default()
                .push(discount_entity);
        }

        // Batch load all products for these order items (eliminates N+1)
        let product_ids: Vec<String> = orderitems_list
            .iter()
            .map(|(oi, _)| oi.product_id.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();

        let product_models = entity::products::Entity::find()
            .filter(entity::products::Column::Id.is_in(product_ids))
            .all(db_raw)
            .await?;

        let products_vec =
            super::product_repository::into_entities_batch(db.clone(), product_models).await?;
        let products_map: HashMap<String, crate::domain::entities::product_entity::ProductEntity> =
            products_vec
                .into_iter()
                .filter_map(|p| p.id.clone().map(|id| (id, p)))
                .collect();

        // Build the result with pre-fetched data
        let mut result = Vec::<OrderItemEntity>::new();
        for (order_item, fueling_order) in orderitems_list {
            let fueling_order = fueling_order.map(fueling_order_repository::into_entity);
            let taxes = taxes_by_order_item
                .remove(&order_item.id)
                .unwrap_or_default();
            let discounts = discounts_by_order_item
                .remove(&order_item.id)
                .unwrap_or_default();

            let d = into_entity_with_product(order_item, fueling_order, taxes, discounts, &products_map);
            result.push(d);
        }
        Ok(result)
    }

    pub async fn get_fueling_order_items(
        db: Arc<DataStore>,
        filter: LazyTableStateDTO<FuelingOrderFilter, FuelingOrderColumn>,
    ) -> Result<MetaPaginatorDTO<OrderItemEntity, FuelingSumaryMeta>> {
        let db_conn = db.get_db()?;

        // 1. Build fueling order query with filters
        let mut query = foi::Entity::find();

        // Filtering
        if let Some(id) = filter.filters.id {
            query = query.filter(foi::Column::Id.eq(id));
        }
        if let Some(order_item_id) = filter.filters.order_item_id {
            query = query.filter(foi::Column::OrderItemId.eq(order_item_id));
        }
        if let Some(nozzle_id) = filter.filters.nozzle_id {
            query = query.filter(foi::Column::NozzleId.eq(nozzle_id));
        }
        if let Some((start, end)) = filter.filters.d_created {
            query = query.filter(foi::Column::DCreated.between(start, end));
        }
        if let Some((start, end)) = filter.filters.d_move {
            query = query.filter(foi::Column::DMove.between(start, end));
        }
        if let Some(fueling_type) = filter.filters.fueling_type {
            query = query.filter(foi::Column::FuelingType.eq(fueling_type.to_string()));
        }
        if let Some(preset_type) = filter.filters.preset_type {
            query = query.filter(foi::Column::PresetType.eq(preset_type.to_string()));
        }
        if let Some(title) = filter.filters.title {
            query = query.filter(foi::Column::Title.contains(title));
        }

        // Calculate totals from the filtered query (without pagination)
        let totals = query
            .clone()
            .select_only()
            .column_as(foi::Column::Volume.sum(), "total_volume")
            .column_as(foi::Column::Amount.sum(), "total_amount")
            .into_tuple::<(Option<Decimal>, Option<Decimal>)>()
            .one(db_conn)
            .await?;

        let (total_volume, total_amount) = totals
            .map(|(vol, amt)| (vol.unwrap_or_default(), amt.unwrap_or_default()))
            .unwrap_or((Decimal::ZERO, Decimal::ZERO));

        // Sorting
        let sort_field: foi::Column = filter.sort_field.into();
        query = query.order_by(sort_field, filter.sort_order.into());

        // Paginate
        let paginator = query
            .clone()
            .paginate(db_conn, filter.rows.try_into().unwrap());

        let page = filter.page.max(1) as u64;
        let fueling_orders = paginator.fetch_page(page - 1).await?;
        let order_item_ids: Vec<String> = fueling_orders
            .iter()
            .map(|fo| fo.order_item_id.clone())
            .collect();

        // 2. Fetch order items with their related fueling orders (should only get those with fueling orders)
        let orderitems_list = oi::Entity::find()
            .find_also_related(foi::Entity)
            .filter(oi::Column::Id.is_in(order_item_ids.clone()))
            .all(db_conn)
            .await?;

        // 3. Batch fetch all taxes for these order items
        let all_taxes = oit::Entity::find()
            .filter(oit::Column::OrderItemId.is_in(order_item_ids.clone()))
            .all(db_conn)
            .await?;

        // 4. Batch fetch all discounts for these order items
        let all_discounts = oid::Entity::find()
            .filter(oid::Column::OrderItemId.is_in(order_item_ids.clone()))
            .all(db_conn)
            .await?;

        // 5. Group taxes and discounts by order_item_id for efficient lookup
        let taxes_by_order_item = {
            let mut map = std::collections::HashMap::<String, Vec<OrderItemTaxEntity>>::new();
            for tax in all_taxes {
                let tax_entity = tax_model_to_entity(tax);
                map.entry(tax_entity.order_item_id.clone())
                    .or_default()
                    .push(tax_entity);
            }
            map
        };

        let discounts_by_order_item = {
            let mut map = std::collections::HashMap::<String, Vec<OrderItemDiscountEntity>>::new();
            for discount in all_discounts {
                let discount_entity = discount_model_to_entity(discount);
                map.entry(discount_entity.order_item_id.clone())
                    .or_default()
                    .push(discount_entity);
            }
            map
        };

        // Batch load all products for these order items (eliminates N+1)
        let product_ids: Vec<String> = orderitems_list
            .iter()
            .map(|(oi, _)| oi.product_id.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();

        let product_models = entity::products::Entity::find()
            .filter(entity::products::Column::Id.is_in(product_ids))
            .all(db_conn)
            .await?;

        let products_vec =
            super::product_repository::into_entities_batch(db.clone(), product_models).await?;
        let products_map: HashMap<String, crate::domain::entities::product_entity::ProductEntity> =
            products_vec
                .into_iter()
                .filter_map(|p| p.id.clone().map(|id| (id, p)))
                .collect();

        // 6. Build the result with pre-fetched data
        let mut result = Vec::<OrderItemEntity>::with_capacity(orderitems_list.len());
        for (order_item, fueling_order) in orderitems_list {
            // Only include if fueling_order is Some
            if let Some(fueling_order) = fueling_order {
                let fueling_order = Some(fueling_order_repository::into_entity(fueling_order));
                let taxes = taxes_by_order_item
                    .get(&order_item.id)
                    .cloned()
                    .unwrap_or_default();
                let discounts = discounts_by_order_item
                    .get(&order_item.id)
                    .cloned()
                    .unwrap_or_default();

                let d =
                    into_entity_with_product(order_item, fueling_order, taxes, discounts, &products_map);
                result.push(d);
            }
        }

        let num_items_and_pages = paginator.num_items_and_pages().await?;

        let res = MetaPaginatorDTO {
            items: result,
            page: page as u32,
            count: num_items_and_pages.number_of_items as u32,
            limit: filter.rows as u32,
            page_count: num_items_and_pages.number_of_pages as u32,
            meta: FuelingSumaryMeta {
                total_volume,
                total_amount,
            },
        };
        Ok(res)
    }

    pub async fn get(
        db: Arc<DataStore>,
        filter: LazyTableStateDTO<OrderItemFilter, OrderItemColumn>,
    ) -> Result<MetaPaginatorDTO<OrderItemEntity, OrderItemMovementSummaryMeta>> {
        let db_conn = db.get_db()?;

        // 1. Build order items query with filters and joins
        let mut query = oi::Entity::find().find_also_related(foi::Entity);

        // Apply filters
        if let Some(id) = filter.filters.id {
            query = query.filter(oi::Column::Id.eq(id));
        }
        if let Some(order_id) = filter.filters.order_id {
            query = query.filter(oi::Column::OrderId.eq(order_id));
        }
        if let Some(product_id) = filter.filters.product_id {
            query = query.filter(oi::Column::ProductId.eq(product_id));
        }
        if let Some(min_count) = filter.filters.min_count {
            query = query.filter(oi::Column::Count.gte(min_count));
        }
        if let Some(max_count) = filter.filters.max_count {
            query = query.filter(oi::Column::Count.lte(max_count));
        }
        if let Some(min_price) = filter.filters.min_price {
            query = query.filter(oi::Column::Price.gte(min_price));
        }
        if let Some(max_price) = filter.filters.max_price {
            query = query.filter(oi::Column::Price.lte(max_price));
        }
        if let Some(min_cost) = filter.filters.min_cost {
            query = query.filter(oi::Column::Cost.gte(min_cost));
        }
        if let Some(max_cost) = filter.filters.max_cost {
            query = query.filter(oi::Column::Cost.lte(max_cost));
        }
        if let Some(min_tax) = filter.filters.min_tax {
            query = query.filter(oi::Column::Tax.gte(min_tax));
        }
        if let Some(max_tax) = filter.filters.max_tax {
            query = query.filter(oi::Column::Tax.lte(max_tax));
        }
        if let Some(min_discount) = filter.filters.min_discount {
            query = query.filter(oi::Column::Discount.gte(min_discount));
        }
        if let Some(max_discount) = filter.filters.max_discount {
            query = query.filter(oi::Column::Discount.lte(max_discount));
        }
        if let Some(has_fueling_order) = filter.filters.has_fueling_order {
            if has_fueling_order {
                query = query.filter(foi::Column::Id.is_not_null());
            } else {
                query = query.filter(foi::Column::Id.is_null());
            }
        }

        // Sorting
        let sort_field: oi::Column = filter.sort_field.into();
        query = query.order_by(sort_field, filter.sort_order.into());

        // Paginate
        let paginator = query
            .clone()
            .paginate(db_conn, filter.rows.try_into().unwrap());

        let page = filter.page.max(1) as u64;
        let orderitems_list = paginator.fetch_page(page - 1).await?;

        if orderitems_list.is_empty() {
            let num_items_and_pages = paginator.num_items_and_pages().await?;
            return Ok(MetaPaginatorDTO {
                items: vec![],
                page: page as u32,
                count: num_items_and_pages.number_of_items as u32,
                limit: filter.rows as u32,
                page_count: num_items_and_pages.number_of_pages as u32,
                meta: OrderItemMovementSummaryMeta {
                    total_volume: rust_decimal::Decimal::ZERO,
                    total_amount: rust_decimal::Decimal::ZERO,
                },
            });
        }

        // Extract order item IDs for batch queries
        let order_item_ids: Vec<String> = orderitems_list
            .iter()
            .map(|(oi, _)| oi.id.clone())
            .collect();

        // Batch fetch all taxes for these order items
        let all_taxes = oit::Entity::find()
            .filter(oit::Column::OrderItemId.is_in(order_item_ids.clone()))
            .all(db_conn)
            .await?;

        // Batch fetch all discounts for these order items
        let all_discounts = oid::Entity::find()
            .filter(oid::Column::OrderItemId.is_in(order_item_ids))
            .all(db_conn)
            .await?;

        // Group taxes and discounts by order_item_id for efficient lookup
        let taxes_by_order_item = {
            let mut map = std::collections::HashMap::<String, Vec<OrderItemTaxEntity>>::new();
            for tax in all_taxes {
                let tax_entity = tax_model_to_entity(tax);
                map.entry(tax_entity.order_item_id.clone())
                    .or_default()
                    .push(tax_entity);
            }
            map
        };

        let discounts_by_order_item = {
            let mut map = std::collections::HashMap::<String, Vec<OrderItemDiscountEntity>>::new();
            for discount in all_discounts {
                let discount_entity = discount_model_to_entity(discount);
                map.entry(discount_entity.order_item_id.clone())
                    .or_default()
                    .push(discount_entity);
            }
            map
        };

        // Batch load all products for these order items (eliminates N+1)
        let product_ids: Vec<String> = orderitems_list
            .iter()
            .map(|(oi, _)| oi.product_id.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();

        let product_models = entity::products::Entity::find()
            .filter(entity::products::Column::Id.is_in(product_ids))
            .all(db_conn)
            .await?;

        let products_vec =
            super::product_repository::into_entities_batch(db.clone(), product_models).await?;
        let products_map: HashMap<String, crate::domain::entities::product_entity::ProductEntity> =
            products_vec
                .into_iter()
                .filter_map(|p| p.id.clone().map(|id| (id, p)))
                .collect();

        // Build the result with pre-fetched data
        let mut result = Vec::<OrderItemEntity>::with_capacity(orderitems_list.len());
        for (order_item, fueling_order) in orderitems_list {
            let fueling_order = fueling_order.map(fueling_order_repository::into_entity);
            let taxes = taxes_by_order_item
                .get(&order_item.id)
                .cloned()
                .unwrap_or_default();
            let discounts = discounts_by_order_item
                .get(&order_item.id)
                .cloned()
                .unwrap_or_default();

            let d = into_entity_with_product(order_item, fueling_order, taxes, discounts, &products_map);
            result.push(d);
        }

        let num_items_and_pages = paginator.num_items_and_pages().await?;

        let res = MetaPaginatorDTO {
            items: result,
            page: page as u32,
            count: num_items_and_pages.number_of_items as u32,
            limit: filter.rows as u32,
            page_count: num_items_and_pages.number_of_pages as u32,
            meta: OrderItemMovementSummaryMeta {
                total_volume: rust_decimal::Decimal::ZERO,
                total_amount: rust_decimal::Decimal::ZERO,
            },
        };
        Ok(res)
    }

    //======Managing functions==========
    pub async fn save_transaction(
        dbtr: &DatabaseTransaction,
        db: Arc<DataStore>,
        mut order_item: OrderItemEntity,
    ) -> Result<OrderItemEntity> {
        let fueling_order = order_item.fueling_order.clone();
        let mut taxes = order_item.taxes.clone();
        let mut discounts = order_item.discounts.clone();

        // Determine if this is a new record (no original ID) or an update
        let is_new = order_item.id.is_none();

        let order_item_id = if is_new {
            // For new records, use insert
            let active_model: oi::ActiveModel = order_item.clone().into();
            let saved = active_model.insert(dbtr).await?;
            saved.id
        } else {
            // For existing records, use update_many to bypass version check issues
            let id = order_item.id.clone().unwrap();
            let now = Utc::now().to_rfc3339();

            oi::Entity::update_many()
                .col_expr(
                    oi::Column::Count,
                    sea_orm::sea_query::Expr::value(order_item.count),
                )
                .col_expr(
                    oi::Column::Price,
                    sea_orm::sea_query::Expr::value(order_item.price),
                )
                .col_expr(
                    oi::Column::Discount,
                    sea_orm::sea_query::Expr::value(order_item.discount),
                )
                .col_expr(
                    oi::Column::Cost,
                    sea_orm::sea_query::Expr::value(order_item.cost),
                )
                .col_expr(
                    oi::Column::Tax,
                    sea_orm::sea_query::Expr::value(order_item.tax),
                )
                .col_expr(oi::Column::UpdatedAt, sea_orm::sea_query::Expr::value(now))
                .col_expr(
                    oi::Column::Version,
                    sea_orm::sea_query::Expr::col(oi::Column::Version).add(1),
                )
                .filter(oi::Column::Id.eq(id.clone()))
                .exec(dbtr)
                .await?;

            id
        };

        // Fetch the saved/updated order item to return
        let saved_order_item = oi::Entity::find()
            .filter(oi::Column::Id.eq(order_item_id.clone()))
            .one(dbtr)
            .await?
            .ok_or(Error::Database(
                "Order item not found after save".to_string(),
            ))?; // Delete existing taxes and discounts for this order item (if updating)
        if order_item.id.is_some() {
            oit::Entity::delete_many()
                .filter(oit::Column::OrderItemId.eq(order_item_id.clone()))
                .exec(dbtr)
                .await?;

            oid::Entity::delete_many()
                .filter(oid::Column::OrderItemId.eq(order_item_id.clone()))
                .exec(dbtr)
                .await?;
        }

        // Save detailed taxes
        for tax in &mut taxes {
            tax.order_item_id = order_item_id.clone();
            let tax_active_model = oit::ActiveModel {
                id: ActiveValue::Set(Uuid::new_v4().to_string()),
                order_item_id: ActiveValue::Set(tax.order_item_id.clone()),
                name: ActiveValue::Set(tax.name.clone()),
                rate: ActiveValue::Set(Some(tax.rate.unwrap_or_default())),
                value: ActiveValue::Set(tax.value),
            };
            let saved_tax = tax_active_model.insert(dbtr).await?;
            tax.id = Some(saved_tax.id);
        }

        // Save detailed discounts
        for discount in &mut discounts {
            discount.order_item_id = order_item_id.clone();
            let discount_active_model = oid::ActiveModel {
                id: ActiveValue::Set(Uuid::new_v4().to_string()),
                order_item_id: ActiveValue::Set(discount.order_item_id.clone()),
                name: ActiveValue::Set(discount.name.clone()),
                value: ActiveValue::Set(discount.value),
            };
            let saved_discount = discount_active_model.insert(dbtr).await?;
            discount.id = Some(saved_discount.id);
        }

        // Update the order_item with the saved ID and detailed collections
        order_item.id = Some(order_item_id);
        order_item.taxes = taxes;
        order_item.discounts = discounts;

        let res = into_entity(
            db.clone(),
            saved_order_item,
            fueling_order,
            order_item.taxes,
            order_item.discounts,
        )
        .await?;
        Ok(res)
    }

    pub async fn stop_fueling(
        dbtr: &DatabaseTransaction,
        db: Arc<DataStore>,
        order_item: &OrderItemEntity,
    ) -> Result<OrderItemEntity> {
        let fueling_order = order_item.fueling_order.clone();
        if let Some(fueling_order) = fueling_order {
            // Create a copy of the order item to update
            let mut updated_item = order_item.clone();

            // Update quantity with the actual fueled volume
            updated_item.update_quantity(fueling_order.volume, &OrderType::SaleDispenser)?;

            // Stop the fueling order
            let updated_fueling_order =
                FuelingOrderRepository::stop_fueling(dbtr, fueling_order).await?;
            updated_item.fueling_order = Some(updated_fueling_order);
            // println!("Update order item: {:#?}", updated_item);

            // Save the updated order item with new calculations
            Self::save_transaction(dbtr, db, updated_item).await
        } else {
            Err(Error::Database("No fueling order found".to_string()))
        }
    }

    /// Get summary totals grouped by nozzle ID, optionally filtered by date range
    ///
    /// # Arguments
    /// * `db` - Database connection
    /// * `start_date` - Optional start date filter (inclusive)
    /// * `end_date` - Optional end date filter (inclusive)
    ///
    /// # Returns
    /// A HashMap where keys are nozzle IDs and values contain aggregated data:
    /// - fo_volume: Sum of fueling order volumes for the nozzle (Decimal)
    /// - fo_amount: Sum of fueling order amounts for the nozzle (Decimal)
    /// - oi_volume: Sum of order item counts for the nozzle (Decimal)
    /// - oi_amount: Sum of order item costs for the nozzle (Decimal)
    pub async fn get_summary_totals_by_nozzle(
        db: Arc<DataStore>,
        start_date: Option<DateTime<Utc>>,
        end_date: Option<DateTime<Utc>>,
    ) -> Result<HashMap<String, NozzleSummaryData>> {
        let mut query = foi::Entity::find()
            .inner_join(oi::Entity)
            .select_only()
            .column(foi::Column::NozzleId)
            .column_as(foi::Column::Volume.sum(), "fo_volume")
            .column_as(foi::Column::Amount.sum(), "fo_amount")
            .column_as(oi::Column::Count.sum(), "oi_volume")
            .column_as(oi::Column::Cost.sum(), "oi_amount")
            .group_by(foi::Column::NozzleId);

        // Apply date filters if provided
        if let Some(start) = start_date {
            // println!("Applying start date filter: {}", start);
            query = query.filter(foi::Column::DMove.gte(start));
        }

        if let Some(end) = end_date {
            // println!("Applying end date filter: {}", end);
            query = query.filter(foi::Column::DMove.lte(end));
        }

        // println!("Query: {:?}", query);
        let results = query
            .into_tuple::<(
                String,
                Option<Decimal>,
                Option<Decimal>,
                Option<Decimal>,
                Option<Decimal>,
            )>()
            .all(db.get_db()?)
            .await
            .map_err(Error::from)?;

        println!("Summary results: {:?}", results);
        let mut summary_map = HashMap::new();

        for (nozzle_id, fo_volume, fo_amount, oi_volume, oi_amount) in results {
            let summary = NozzleSummaryData {
                nozzle_id: nozzle_id.clone(),
                fo_volume: fo_volume.unwrap_or(Decimal::ZERO),
                fo_amount: fo_amount.unwrap_or(Decimal::ZERO),
                oi_volume: oi_volume.unwrap_or(Decimal::ZERO),
                oi_amount: oi_amount.unwrap_or(Decimal::ZERO),
            };
            summary_map.insert(nozzle_id, summary);
        }

        Ok(summary_map)
    }
}

impl From<FuelingOrderColumn> for foi::Column {
    fn from(order_column: FuelingOrderColumn) -> Self {
        match order_column {
            FuelingOrderColumn::Id => foi::Column::Id,
            FuelingOrderColumn::OrderItemId => foi::Column::OrderItemId,
            FuelingOrderColumn::NozzleId => foi::Column::NozzleId,
            FuelingOrderColumn::DCreated => foi::Column::DCreated,
            FuelingOrderColumn::DMove => foi::Column::DMove,
            FuelingOrderColumn::Volume => foi::Column::Volume,
            FuelingOrderColumn::Amount => foi::Column::Amount,
            FuelingOrderColumn::FuelingType => foi::Column::FuelingType,
            FuelingOrderColumn::PresetType => foi::Column::PresetType,
            FuelingOrderColumn::Title => foi::Column::Title,
            FuelingOrderColumn::PresetVolume => foi::Column::PresetVolume,
            FuelingOrderColumn::PresetAmount => foi::Column::PresetAmount,
        }
    }
}

impl From<OrderItemColumn> for oi::Column {
    fn from(order_column: OrderItemColumn) -> Self {
        match order_column {
            OrderItemColumn::Id => oi::Column::Id,
            OrderItemColumn::OrderId => oi::Column::OrderId,
            OrderItemColumn::ProductId => oi::Column::ProductId,
            OrderItemColumn::Count => oi::Column::Count,
            OrderItemColumn::Price => oi::Column::Price,
            OrderItemColumn::Discount => oi::Column::Discount,
            OrderItemColumn::Cost => oi::Column::Cost,
            OrderItemColumn::Tax => oi::Column::Tax,
        }
    }
}
