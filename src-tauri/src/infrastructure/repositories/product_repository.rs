use crate::Result;
use crate::adapters::dtos::{ProductMovementFilter, ProductMovementItem, ProductMovementReport};
use crate::domain::entities::discount_entity::DiscountEntity;
use crate::domain::entities::group_entity::GroupEntity;
use crate::domain::entities::price_entity::PriceEntity;
use crate::domain::entities::tax_entity::TaxEntity;
use crate::domain::entities::unit_entity::UnitEntity;
use crate::domain::repositories::{
    DiscountRepository, GroupRepository, PriceRepository, ProductRepository, TaxRepository,
    UnitRepository,
};
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use crate::{
    domain::entities::product_entity::ProductEntity,
    shared::types::{PriceType, ProductType},
};
use entity::order_items as OrderItem;
use entity::orders as Order;
use entity::products::{ActiveModel, Column, Entity, Model};
use futures::try_join;
use rust_decimal::Decimal;
use sea_orm::sea_query::{Alias, Expr, SelectStatement, SimpleExpr, UpdateStatement};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, ConnectionTrait, DatabaseTransaction, EntityTrait,
    FromQueryResult, JoinType, PaginatorTrait, QueryFilter, QueryOrder, QuerySelect, RelationTrait,
    TransactionTrait,
};
use std::str::FromStr;
use std::sync::Arc;
use uuid::Uuid;

/// Helper struct for sub-query that extracts distinct product IDs
#[derive(Debug, FromQueryResult)]
struct ProductIdRow {
    product_id: String,
}

/// Вспомогательная функция для построения ProductEntity
fn build_product_entity(
    model: Model,
    prices: Vec<PriceEntity>,
    taxes: Vec<TaxEntity>,
    discounts: Vec<DiscountEntity>,
    group: Option<GroupEntity>,
    unit: Option<UnitEntity>,
) -> ProductEntity {
    let sale_price = ProductEntity::compute_price_by_type(&prices, PriceType::Sale);
    let income_price = ProductEntity::compute_price_by_type(&prices, PriceType::Income);
    let outcome_price = ProductEntity::compute_price_by_type(&prices, PriceType::Outcome);

    ProductEntity {
        id: Some(model.id),
        device_id: model.device_id,
        name: model.name,
        short_name: model.short_name,
        product_type: ProductType::from_str(&model.product_type).unwrap_or_default(),
        unit,
        bar_code: model.bar_code,
        article: model.article,
        balance: model.balance,
        group,
        prices,
        discounts,
        taxes,
        sale_price,
        income_price,
        outcome_price,
        created_at: model.created_at,
        updated_at: model.updated_at,
        deleted_at: model.deleted_at,
        version: model.version,
        image_paths: model
            .image_paths
            .map(|paths| serde_json::from_str::<Vec<String>>(&paths).unwrap_or_default())
            .unwrap_or_default(),
    }
}

pub async fn into_entity(db: Arc<DataStore>, model: Model) -> Result<ProductEntity> {
    // let start_time = std::time::Instant::now();
    let (prices, taxes, discounts, group, unit) = try_join!(
        PriceRepository::product_prices(db.clone(), model.id.clone()),
        TaxRepository::product_taxes(db.clone(), model.id.clone()),
        DiscountRepository::product_discounts(db.clone(), model.id.clone()),
        GroupRepository::get_by_id(db.clone(), model.group_id.clone()),
        UnitRepository::get_by_id(db.clone(), model.unit_id.clone())
    )?;
    // tracing::info!("Fetched relations for product {} in {:?}", model.id, start_time.elapsed());

    Ok(build_product_entity(
        model,
        prices,
        taxes,
        discounts,
        Some(group),
        Some(unit),
    ))
}
pub async fn into_entities_batch(
    db: Arc<DataStore>,
    models: Vec<Model>,
) -> Result<Vec<ProductEntity>> {
    if models.is_empty() {
        return Ok(Vec::new());
    }
    // Собираем все ID
    let product_ids: Vec<String> = models.iter().map(|m| m.id.clone()).collect();
    let group_ids: Vec<String> = models.iter().map(|m| m.group_id.clone()).collect();
    let unit_ids: Vec<String> = models.iter().map(|m| m.unit_id.clone()).collect();

    // Batch запросы - 5 запросов вместо N*5
    let (prices_map, taxes_map, discounts_map, groups_map, units_map) = try_join!(
        PriceRepository::products_prices_batch(db.clone(), &product_ids),
        TaxRepository::products_taxes_batch(db.clone(), &product_ids),
        DiscountRepository::products_discounts_batch(db.clone(), &product_ids),
        GroupRepository::get_by_ids_batch(db.clone(), &group_ids),
        UnitRepository::get_by_ids_batch(db.clone(), &unit_ids)
    )?;

    // Собираем результаты используя HashMap'ы
    let results: Vec<ProductEntity> = models
        .into_iter()
        .map(|model| {
            let prices = prices_map.get(&model.id).cloned().unwrap_or_default();
            let taxes = taxes_map.get(&model.id).cloned().unwrap_or_default();
            let discounts = discounts_map.get(&model.id).cloned().unwrap_or_default();
            let group = groups_map.get(&model.group_id).cloned();
            let unit = units_map.get(&model.unit_id).cloned();

            build_product_entity(model, prices, taxes, discounts, group, unit)
        })
        .collect();

    Ok(results)
}
impl From<ProductEntity> for ActiveModel {
    fn from(entity: ProductEntity) -> Self {
        ActiveModel {
            id: entity.id.map_or(ActiveValue::NotSet, ActiveValue::Set),
            device_id: ActiveValue::Set(entity.device_id),
            name: ActiveValue::Set(entity.name),
            short_name: ActiveValue::Set(entity.short_name),
            product_type: ActiveValue::Set(entity.product_type.to_string()),
            unit_id: ActiveValue::Set(entity.unit.and_then(|u| u.id).unwrap_or_default()),
            bar_code: ActiveValue::Set(entity.bar_code),
            article: ActiveValue::Set(entity.article),
            balance: ActiveValue::Set(entity.balance),
            group_id: ActiveValue::Set(entity.group.and_then(|g| g.id).unwrap_or_default()),
            created_at: ActiveValue::Set(entity.created_at),
            updated_at: ActiveValue::Set(entity.updated_at),
            deleted_at: ActiveValue::Set(entity.deleted_at),
            version: ActiveValue::Set(entity.version),
            image_paths: ActiveValue::Set(serde_json::to_string(&entity.image_paths).ok()),
        }
    }
}

impl ProductRepository {
    /// Get all non-deleted products (for normal operations)
    pub async fn get(db: Arc<DataStore>) -> Result<Vec<ProductEntity>> {
        let db_raw = db.get_db()?;
        let products_list = Entity::find()
            .filter(Column::DeletedAt.is_null())
            .all(db_raw)
            .await?;
        let plist = products_list.clone();
        let result: Vec<ProductEntity> = into_entities_batch(db.clone(), plist).await?;
        Ok(result)
    }

    /// Get all products including deleted ones (for admin/sync)
    pub async fn get_all(db: Arc<DataStore>) -> Result<Vec<ProductEntity>> {
        let db_raw = db.get_db()?;
        let products_list = Entity::find().all(db_raw).await?;
        let result = into_entities_batch(db, products_list).await?;
        Ok(result)
    }

    /// Get products with server-side pagination, filtering and sorting
    pub async fn get_paginated(
        db: Arc<DataStore>,
        filter: crate::adapters::dtos::LazyTableStateDTO<
            crate::adapters::dtos::ProductFilter,
            crate::adapters::dtos::ProductColumn,
        >,
    ) -> Result<crate::adapters::dtos::PaginatorDTO<ProductEntity>> {
        let db_conn = db.get_db()?;
        let f = &filter.filters;

        // ── 1. If "active in period" filter is set, collect matching product IDs ──
        let active_product_ids: Option<Vec<String>> =
            if let (Some(date_from), Some(date_to)) = (&f.active_date_from, &f.active_date_to) {
                // Sub-query: SELECT DISTINCT product_id FROM order_items
                //   JOIN orders ON orders.id = order_items.order_id
                //   WHERE orders.d_move BETWEEN date_from AND date_to
                //     AND order_items.deleted_at IS NULL
                let rows = Order::Entity::find()
                    .inner_join(OrderItem::Entity)
                    .select_only()
                    .column_as(OrderItem::Column::ProductId, "product_id")
                    .filter(Order::Column::DMove.gte(date_from.clone()))
                    .filter(Order::Column::DMove.lte(date_to.clone()))
                    .filter(OrderItem::Column::DeletedAt.is_null())
                    .group_by(OrderItem::Column::ProductId)
                    .into_model::<ProductIdRow>()
                    .all(db_conn)
                    .await?;

                Some(rows.into_iter().map(|r| r.product_id).collect())
            } else {
                None
            };

        // ── 2. Build the main product query ──
        let mut query = Entity::find().filter(Column::DeletedAt.is_null());

        // Active-in-period filter
        if let Some(ref ids) = active_product_ids {
            if ids.is_empty() {
                // No products match → return empty page
                return Ok(crate::adapters::dtos::PaginatorDTO {
                    items: Vec::new(),
                    page: filter.page as u32,
                    count: 0,
                    limit: filter.rows as u32,
                    page_count: 0,
                });
            }
            query = query.filter(Column::Id.is_in(ids.clone()));
        }

        // Text search (SQLite LIKE is case-insensitive for ASCII by default)
        if let Some(ref search) = f.search {
            if !search.trim().is_empty() {
                let like = format!("%{}%", search.trim());
                query = query.filter(
                    sea_orm::Condition::any()
                        .add(Column::Name.contains(&like))
                        .add(Column::ShortName.contains(&like))
                        .add(Column::BarCode.contains(&like))
                        .add(Column::Article.contains(&like)),
                );
            }
        }

        // Product type filter
        if let Some(ref pt) = f.product_type {
            query = query.filter(Column::ProductType.eq(pt.to_string()));
        }

        // Group filter
        if let Some(ref gid) = f.group_id {
            query = query.filter(Column::GroupId.eq(gid.clone()));
        }

        // ── 3. Sort ──
        let sort_order: sea_orm::Order = filter.sort_order.clone().into();
        if matches!(filter.sort_field, crate::adapters::dtos::ProductColumn::Article) {
            // Article is stored as String but represents a number → CAST for numeric sorting
            query = query.order_by(Expr::cust("CAST(article AS INTEGER)"), sort_order);
        } else {
            let sort_col: Column = match filter.sort_field {
                crate::adapters::dtos::ProductColumn::Name => Column::Name,
                crate::adapters::dtos::ProductColumn::Article => unreachable!(),
                crate::adapters::dtos::ProductColumn::ProductType => Column::ProductType,
                crate::adapters::dtos::ProductColumn::Balance => Column::Balance,
                crate::adapters::dtos::ProductColumn::CreatedAt => Column::CreatedAt,
                crate::adapters::dtos::ProductColumn::UpdatedAt => Column::UpdatedAt,
            };
            query = query.order_by(sort_col, sort_order);
        }

        // ── 4. Paginate ──
        let paginator = query.paginate(db_conn, filter.rows.max(1) as u64);
        let page = filter.page.max(1) as u64;
        let models = paginator.fetch_page(page - 1).await?;
        let num = paginator.num_items_and_pages().await?;

        // ── 5. Batch-load relations ──
        let items = into_entities_batch(db, models).await?;

        Ok(crate::adapters::dtos::PaginatorDTO {
            items,
            page: page as u32,
            count: num.number_of_items as u32,
            limit: filter.rows as u32,
            page_count: num.number_of_pages as u32,
        })
    }

    /// Get product by ID (only if not deleted)
    pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<ProductEntity> {
        let db_raw = db.get_db()?;
        let data = Entity::find_by_id(id)
            .filter(Column::DeletedAt.is_null())
            .one(db_raw)
            .await?;
        let product = data.ok_or(Self::product_not_found_error())?;
        let product = into_entity(db.clone(), product).await?;
        Ok(product)
    }

    pub async fn save_with_relations(
        db: Arc<DataStore>,
        entity: ProductEntity,
        unit_id: Option<String>,
        group_id: Option<String>,
        discount_ids: &[String],
        tax_ids: &[String],
    ) -> Result<ProductEntity> {
        let dbtr = db.get_db()?;
        let txn = dbtr.begin().await?;
        println!("Starting product save transaction...");

        // Validate foreign keys before saving
        if let Some(ref uid) = unit_id {
            use entity::units;
            let unit_exists = units::Entity::find_by_id(uid).one(&txn).await?.is_some();
            if !unit_exists {
                return Err(crate::shared::error::Error::Database(format!(
                    "Unit not found: {}",
                    uid
                )));
            }
        }

        if let Some(ref gid) = group_id {
            use entity::groups;
            let group_exists = groups::Entity::find_by_id(gid).one(&txn).await?.is_some();
            if !group_exists {
                return Err(crate::shared::error::Error::Database(format!(
                    "Group not found: {}",
                    gid
                )));
            }
        }

        // Determine if this is a new product or an update
        let is_new = entity.id.is_none();
        let now = chrono::Utc::now().to_rfc3339();

        // Save the product itself with metadata handled by repository
        let active_model: ActiveModel = ActiveModel {
            id: if is_new {
                ActiveValue::Set(Uuid::new_v4().to_string())
            } else {
                ActiveValue::Unchanged(entity.id.clone().unwrap())
            },
            device_id: ActiveValue::Set(entity.device_id),
            name: ActiveValue::Set(entity.name),
            short_name: ActiveValue::Set(entity.short_name),
            product_type: ActiveValue::Set(entity.product_type.to_string()),
            unit_id: unit_id.map_or(ActiveValue::NotSet, ActiveValue::Set),
            bar_code: ActiveValue::Set(entity.bar_code),
            article: ActiveValue::Set(entity.article),
            balance: ActiveValue::Set(entity.balance),
            group_id: group_id.map_or(ActiveValue::NotSet, ActiveValue::Set),
            // Metadata handled by repository
            created_at: if is_new {
                ActiveValue::Set(now.clone())
            } else {
                ActiveValue::Unchanged(entity.created_at)
            },
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: if is_new {
                ActiveValue::Set(1)
            } else {
                ActiveValue::Set(entity.version + 1)
            },
            image_paths: ActiveValue::Set(serde_json::to_string(&entity.image_paths).ok()), // Placeholder for image paths
        };

        let saved = if is_new {
            active_model.insert(&txn).await?
        } else {
            active_model.update(&txn).await?
        };

        println!("Product saved with ID: {:?}", saved.id);
        let product_id = saved.id;

        // Set relations
        println!("Setting product discounts: {:?}", discount_ids);
        DiscountRepository::set_product_discounts(&txn, product_id.clone(), discount_ids).await?;

        println!("Setting product taxes: {:?}", tax_ids);
        TaxRepository::set_product_taxes(&txn, product_id.clone(), tax_ids).await?;

        // Calculate balance
        ProductRepository::calc_product_balance(&txn, product_id.clone()).await?;

        txn.commit().await?;

        // Return the fully populated entity
        let res = ProductRepository::get_by_id(db, product_id).await?;
        Ok(res)
    }

    /// Calculates and updates the balance for all products.
    pub async fn calc_all_products_balance(txn: &DatabaseTransaction) -> Result<(u64, u64)> {
        Self::calc_product_balance_internal(txn, None).await
    }

    /// Calculates and updates the balance for a single product.
    pub async fn calc_product_balance(
        txn: &DatabaseTransaction,
        product_id: String,
    ) -> Result<(u64, u64)> {
        Self::calc_product_balance_internal(txn, Some(product_id)).await
    }

    /// Internal method that handles both single product and all products balance calculation.
    async fn calc_product_balance_internal(
        txn: &DatabaseTransaction,
        product_id: Option<String>,
    ) -> Result<(u64, u64)> {
        let db_backend = txn.get_database_backend();

        // Build the balance calculation subquery
        let balance_subquery = Self::build_balance_calculation_query(product_id.as_ref());
        let subquery_sql = db_backend.build(&balance_subquery).to_string();

        // Build the update query
        let mut update_query = UpdateStatement::new()
            .table(Entity)
            .value(
                Column::Balance,
                Expr::expr(Expr::cust(format!("({})", subquery_sql))).if_null(0),
            )
            .to_owned();

        // Add WHERE clause for single product update
        if let Some(id) = product_id {
            update_query = update_query
                .and_where(Expr::col((Entity, Column::Id)).eq(Expr::value(id)))
                .to_owned();
        }

        let statement = db_backend.build(&update_query);
        let result = txn.execute(statement).await?;

        Ok((result.last_insert_id(), result.rows_affected()))
    }

    /// Builds the balance calculation subquery with optional product filtering.
    /// Only considers non-deleted orders and order items for accurate balance.
    fn build_balance_calculation_query(product_id: Option<&String>) -> SelectStatement {
        let case_statement: SimpleExpr = Expr::case(
            Expr::col(Order::Column::OrderType).is_in(vec!["Income", "Returns"]),
            Expr::col(OrderItem::Column::Count),
        )
        .finally(Expr::col(OrderItem::Column::Count).mul(-1))
        .into();

        let mut select = SelectStatement::new()
            .expr_as(Expr::expr(case_statement).sum(), Alias::new("new_balance"))
            .from(OrderItem::Entity)
            .join(
                JoinType::InnerJoin,
                Order::Entity,
                Expr::col(OrderItem::Column::OrderId)
                    .eq(Expr::col((Order::Entity, Order::Column::Id))),
            )
            .and_where(
                Expr::col((OrderItem::Entity, OrderItem::Column::ProductId))
                    .eq(Expr::col((Entity, Column::Id))),
            )
            // Exclude soft-deleted orders and order items from balance calculation
            .and_where(Expr::col((Order::Entity, Order::Column::DeletedAt)).is_null())
            .and_where(
                Expr::col((OrderItem::Entity, OrderItem::Column::DeletedAt)).is_null(),
            )
            .group_by_col(OrderItem::Column::ProductId)
            .to_owned();

        // Add product-specific filtering if needed
        if let Some(id) = product_id {
            select = select
                .and_where(Expr::col((Entity, Column::Id)).eq(Expr::value(id.clone())))
                .to_owned();
        }

        select
    }

    /// Soft delete - marks product as deleted (for normal operations)
    pub async fn delete(db: Arc<DataStore>, product_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let now = chrono::Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&product_id))
            .filter(Column::DeletedAt.is_null())
            .one(db_conn)
            .await?
            .ok_or(Self::product_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            name: ActiveValue::Unchanged(existing.name),
            short_name: ActiveValue::Unchanged(existing.short_name),
            product_type: ActiveValue::Unchanged(existing.product_type),
            unit_id: ActiveValue::Unchanged(existing.unit_id),
            bar_code: ActiveValue::Unchanged(existing.bar_code),
            article: ActiveValue::Unchanged(existing.article),
            balance: ActiveValue::Unchanged(existing.balance),
            group_id: ActiveValue::Unchanged(existing.group_id),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now.clone()),
            deleted_at: ActiveValue::Set(Some(now)),
            version: ActiveValue::Set(existing.version + 1),
            image_paths: ActiveValue::Unchanged(existing.image_paths),
        };

        active_model.update(db_conn).await?;
        Ok(1)
    }

    /// Permanent delete - completely removes product from database (for sync/cleanup)
    pub async fn delete_permanent(db: Arc<DataStore>, product_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = Entity::delete_many()
            .filter(Column::Id.eq(product_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    /// Restore a soft-deleted product
    pub async fn restore(db: Arc<DataStore>, product_id: String) -> Result<ProductEntity> {
        let db_conn = db.get_db()?;
        let now = chrono::Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&product_id))
            .one(db_conn)
            .await?
            .ok_or(Self::product_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            name: ActiveValue::Unchanged(existing.name),
            short_name: ActiveValue::Unchanged(existing.short_name),
            product_type: ActiveValue::Unchanged(existing.product_type),
            unit_id: ActiveValue::Unchanged(existing.unit_id),
            bar_code: ActiveValue::Unchanged(existing.bar_code),
            article: ActiveValue::Unchanged(existing.article),
            balance: ActiveValue::Unchanged(existing.balance),
            group_id: ActiveValue::Unchanged(existing.group_id),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(existing.version + 1),
            image_paths: ActiveValue::Unchanged(existing.image_paths),
        };

        let res = active_model.update(db_conn).await?;
        into_entity(db, res).await
    }

    fn product_not_found_error() -> Error {
        Error::DBDataNotFound("product_not_found".to_string())
    }

    /// Generates a product movement report for a given date range.
    /// For each non-deleted product shows:
    /// - start_balance: sum of all order_items BEFORE date_from
    /// - income_qty / sale_qty / returns_qty / outcome_qty: quantities within the period
    /// - end_balance: start_balance + income + returns - sales - outcome
    pub async fn get_product_movement_report(
        db: Arc<DataStore>,
        filter: ProductMovementFilter,
    ) -> Result<ProductMovementReport> {
        let db_conn = db.get_db()?;

        // 1. Get all non-deleted products (optionally filtered by product_id)
        let mut product_query = Entity::find().filter(Column::DeletedAt.is_null());
        if let Some(ref pid) = filter.product_id {
            product_query = product_query.filter(Column::Id.eq(pid));
        }
        let products = product_query.all(db_conn).await?;

        if products.is_empty() {
            return Ok(ProductMovementReport {
                items: Vec::new(),
                date_from: filter.date_from.clone(),
                date_to: filter.date_to.clone(),
            });
        }

        // Helper struct for query results
        #[derive(Debug, FromQueryResult)]
        struct MovementRow {
            product_id: String,
            order_type: String,
            total_count: Option<Decimal>,
        }

        // 2. Calculate start_balance: SUM of all order_items BEFORE date_from
        //    Income/Returns → positive, Sale/SaleDispenser/Outcome → negative
        let start_balance_query = OrderItem::Entity::find()
            .join(JoinType::InnerJoin, OrderItem::Relation::Orders.def())
            .filter(Order::Column::DMove.lt(&filter.date_from))
            .filter(Order::Column::DeletedAt.is_null())
            .filter(OrderItem::Column::DeletedAt.is_null());

        let start_balance_query = if let Some(ref pid) = filter.product_id {
            start_balance_query.filter(OrderItem::Column::ProductId.eq(pid))
        } else {
            start_balance_query
        };

        let start_balance_rows = start_balance_query
            .select_only()
            .column(OrderItem::Column::ProductId)
            .column(Order::Column::OrderType)
            .column_as(OrderItem::Column::Count.sum(), "total_count")
            .group_by(OrderItem::Column::ProductId)
            .group_by(Order::Column::OrderType)
            .into_model::<MovementRow>()
            .all(db_conn)
            .await?;

        // 3. Calculate movements WITHIN the period [date_from, date_to]
        let period_query = OrderItem::Entity::find()
            .join(JoinType::InnerJoin, OrderItem::Relation::Orders.def())
            .filter(Order::Column::DMove.between(&filter.date_from, &filter.date_to))
            .filter(Order::Column::DeletedAt.is_null())
            .filter(OrderItem::Column::DeletedAt.is_null());

        let period_query = if let Some(ref pid) = filter.product_id {
            period_query.filter(OrderItem::Column::ProductId.eq(pid))
        } else {
            period_query
        };

        let period_rows = period_query
            .select_only()
            .column(OrderItem::Column::ProductId)
            .column(Order::Column::OrderType)
            .column_as(OrderItem::Column::Count.sum(), "total_count")
            .group_by(OrderItem::Column::ProductId)
            .group_by(Order::Column::OrderType)
            .into_model::<MovementRow>()
            .all(db_conn)
            .await?;

        // 4. Load unit names for products
        let unit_ids: Vec<String> = products
            .iter()
            .map(|p| p.unit_id.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();

        let units: std::collections::HashMap<String, String> = if !unit_ids.is_empty() {
            entity::units::Entity::find()
                .filter(entity::units::Column::Id.is_in(unit_ids))
                .all(db_conn)
                .await?
                .into_iter()
                .map(|u| (u.id.clone(), u.name.clone()))
                .collect()
        } else {
            std::collections::HashMap::new()
        };

        // 5. Aggregate data per product
        use std::collections::HashMap;
        let mut start_balances: HashMap<String, Decimal> = HashMap::new();
        for row in &start_balance_rows {
            let qty = row.total_count.unwrap_or_default();
            let signed = match row.order_type.as_str() {
                "Income" | "Returns" => qty,
                _ => -qty, // Sale, SaleDispenser, Outcome
            };
            *start_balances.entry(row.product_id.clone()).or_default() += signed;
        }

        let mut period_income: HashMap<String, Decimal> = HashMap::new();
        let mut period_sale: HashMap<String, Decimal> = HashMap::new();
        let mut period_returns: HashMap<String, Decimal> = HashMap::new();
        let mut period_outcome: HashMap<String, Decimal> = HashMap::new();

        for row in &period_rows {
            let qty = row.total_count.unwrap_or_default();
            match row.order_type.as_str() {
                "Income" => {
                    *period_income.entry(row.product_id.clone()).or_default() += qty;
                }
                "Sale" | "SaleDispenser" => {
                    *period_sale.entry(row.product_id.clone()).or_default() += qty;
                }
                "Returns" => {
                    *period_returns.entry(row.product_id.clone()).or_default() += qty;
                }
                "Outcome" => {
                    *period_outcome.entry(row.product_id.clone()).or_default() += qty;
                }
                _ => {}
            }
        }

        // 6. Build result items
        let mut items: Vec<ProductMovementItem> = products
            .into_iter()
            .map(|p| {
                let pid = p.id.clone();
                let start_balance = *start_balances.get(&pid).unwrap_or(&Decimal::ZERO);
                let income_qty = *period_income.get(&pid).unwrap_or(&Decimal::ZERO);
                let sale_qty = *period_sale.get(&pid).unwrap_or(&Decimal::ZERO);
                let returns_qty = *period_returns.get(&pid).unwrap_or(&Decimal::ZERO);
                let outcome_qty = *period_outcome.get(&pid).unwrap_or(&Decimal::ZERO);
                let end_balance = start_balance + income_qty + returns_qty - sale_qty - outcome_qty;
                let diff = end_balance - start_balance;

                let unit_name: Option<String> = units.get(&p.unit_id).cloned();

                ProductMovementItem {
                    product_id: pid,
                    product_name: p.name,
                    product_short_name: if p.short_name.is_empty() { None } else { Some(p.short_name) },
                    unit_name,
                    start_balance,
                    income_qty,
                    sale_qty,
                    returns_qty,
                    outcome_qty,
                    end_balance,
                    diff,
                }
            })
            .collect();

        // Sort by product name
        items.sort_by(|a, b| a.product_name.cmp(&b.product_name));

        Ok(ProductMovementReport {
            items,
            date_from: filter.date_from,
            date_to: filter.date_to,
        })
    }
}
