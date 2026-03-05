use super::*;
use crate::adapters::dtos::OrderTypeTotals;
use crate::domain::repositories::{ClientRepository, OrderItemRepository, OrderRepository, PaymentRepository};
use crate::shared::error::Error;
use crate::shared::types::OrderType;
use futures::try_join;

use entity::{order_items, orders as ord};

use sea_orm::{
    ColumnTrait, EntityTrait, JoinType, PaginatorTrait, QueryFilter, QueryOrder, QuerySelect,
    RelationTrait, Select,
};

use std::collections::HashSet;
use std::str::FromStr;
use std::sync::Arc;

impl OrderFetching for OrderRepository {
    async fn get_history(
        db: Arc<DataStore>,
        dispenser_id: String,
        limit: u64,
    ) -> Result<Vec<OrderEntity>> {
        let db_conn = db.get_db()?;

        // ВАЖНО:
        // Из-за join'ов ниже один и тот же order может прийти несколько раз
        // (по числу order_items / fueling_order записей).
        // Поэтому добавляем DISTINCT.
        let query = ord::Entity::find()
            .distinct()
            .join(JoinType::InnerJoin, ord::Relation::OrderItems.def())
            .join(
                JoinType::InnerJoin,
                entity::order_items::Entity::belongs_to(entity::fueling_order::Entity)
                    .from(entity::order_items::Column::Id)
                    .to(entity::fueling_order::Column::OrderItemId)
                    .into(),
            )
            .join(
                JoinType::InnerJoin,
                entity::fueling_order::Entity::belongs_to(entity::nozzles::Entity)
                    .from(entity::fueling_order::Column::NozzleId)
                    .to(entity::nozzles::Column::Id)
                    .into(),
            )
            .filter(ord::Column::OrderType.eq("SaleDispenser"))
            .filter(entity::fueling_order::Column::DMove.is_not_null())
            .filter(entity::nozzles::Column::DispenserId.eq(dispenser_id))
            .order_by_desc(ord::Column::DCreated)
            .limit(limit);

        let orders_list = query.all(db_conn).await?;

        // Доп. защита от дублей (на случай особенностей DISTINCT в твоей БД/схеме)
        let mut seen: HashSet<String> = HashSet::new();
        let orders_list: Vec<_> = orders_list
            .into_iter()
            .filter(|m| seen.insert(m.id.clone()))
            .collect();

        // Параллельно собираем OrderEntity (ускоряет, даже если остаётся N+1)
        let orders = build_orders_with_items(db, orders_list, 8).await?;
        Ok(orders)
    }

    async fn get(
        db: Arc<DataStore>,
        filter: LazyTableStateDTO<OrderFilter, OrderColumn>,
    ) -> Result<PaginatorDTO<OrderEntity>> {
        use std::time::Instant;

        let _total_start = Instant::now();

        let db_conn = db.get_db()?;
        let mut query = ord::Entity::find();

        // Apply filters
        if let Some(id) = filter.filters.id {
            query = query.filter(ord::Column::Id.eq(id));
        }
        if let Some(client_id) = filter.filters.client_id {
            query = query.filter(ord::Column::ClientId.eq(client_id));
        }
        if let Some(ref company) = filter.filters.company {
            query = query
                .join(JoinType::InnerJoin, ord::Relation::Clients.def())
                .filter(entity::clients::Column::Name.contains(company));
        }
        if let Some(order_type) = filter.filters.order_type {
            query = query.filter(ord::Column::OrderType.eq(order_type.to_string()));
        }
        if let Some((start, end)) = filter.filters.d_move {
            query = query.filter(ord::Column::DMove.between(start, end));
        }

        // Apply sorting
        let sort_field: ord::Column = filter.sort_field.into();
        query = query.order_by(sort_field, filter.sort_order.into());

        // Paginate (без паники)
        let per_page: u64 = filter.rows.try_into().unwrap_or(20);
        let paginator = query.paginate(db_conn, per_page);

        let page = filter.page.max(1) as u64;

        let orders = paginator.fetch_page(page - 1).await?;

        // Быстро собираем items
        let items = if orders.is_empty() {
            Vec::new()
        } else {
            build_orders_with_items(db.clone(), orders, 8).await?
        };
        let num_items_and_pages = paginator.num_items_and_pages().await?;

        Ok(PaginatorDTO {
            items,
            page: page as u32,
            count: num_items_and_pages.number_of_items as u32,
            limit: per_page as u32,
            page_count: num_items_and_pages.number_of_pages as u32,
        })
    }

    async fn get_movement_report(
        db: Arc<DataStore>,
        filter: LazyTableStateDTO<OrderFilter, OrderColumn>,
    ) -> Result<MetaPaginatorDTO<OrderEntity, OrderMovementSummaryMeta>> {
        let db_conn = db.get_db()?;
        let mut query = ord::Entity::find();

        // Apply filters
        if let Some(ref id) = filter.filters.id {
            query = query.filter(ord::Column::Id.eq(id));
        }
        if let Some(ref client_id) = filter.filters.client_id {
            query = query.filter(ord::Column::ClientId.eq(client_id));
        }
        if let Some(ref company) = filter.filters.company {
            query = query
                .join(JoinType::InnerJoin, ord::Relation::Clients.def())
                .filter(entity::clients::Column::Name.contains(company));
        }
        if let Some(ref order_type) = filter.filters.order_type {
            query = query.filter(ord::Column::OrderType.eq(order_type.to_string()));
        }
        if let Some((start, end)) = filter.filters.d_move {
            query = query.filter(ord::Column::DMove.between(start, end));
        }

        // Apply sorting
        let sort_field: ord::Column = filter.sort_field.into();
        query = query.order_by(sort_field, filter.sort_order.into());

        // Paginate (без паники)
        let per_page: u64 = filter.rows.try_into().unwrap_or(20);
        let paginator = query.clone().paginate(db_conn, per_page);

        let page = filter.page.max(1) as u64;
        let orders = paginator.fetch_page(page - 1).await?;

        let result: Vec<OrderEntity> = if orders.is_empty() {
            Vec::new()
        } else {
            build_orders_with_items(db.clone(), orders, 8).await?
        };

        let num_items_and_pages = paginator.num_items_and_pages().await?;

        // -----------------------------
        // Totals grouped by order type
        // -----------------------------
        // Базовая функция для применения фильтров к totals_query
        let apply_totals_filters =
            |mut q: Select<order_items::Entity>| -> Select<order_items::Entity> {
                if let Some(ref id) = filter.filters.id {
                    q = q.filter(ord::Column::Id.eq(id));
                }
                if let Some(ref client_id) = filter.filters.client_id {
                    q = q.filter(ord::Column::ClientId.eq(client_id));
                }
                if let Some(ref company) = filter.filters.company {
                    q = q
                        .join(JoinType::InnerJoin, ord::Relation::Clients.def())
                        .filter(entity::clients::Column::Name.contains(company));
                }
                if let Some(ref order_type) = filter.filters.order_type {
                    q = q.filter(ord::Column::OrderType.eq(order_type.to_string()));
                }
                if let Some((start, end)) = filter.filters.d_move {
                    q = q.filter(ord::Column::DMove.between(start, end));
                }
                q
            };

        // ========================================
        // 1. Totals для НЕ-SaleDispenser заказов
        // ========================================
        let non_dispenser_query = order_items::Entity::find()
            .join(JoinType::InnerJoin, order_items::Relation::Orders.def())
            .filter(ord::Column::OrderType.ne("SaleDispenser"));

        let non_dispenser_query = apply_totals_filters(non_dispenser_query);

        let non_dispenser_totals = non_dispenser_query
            .select_only()
            .column(ord::Column::OrderType)
            .column_as(order_items::Column::Cost.sum(), "total_sum")
            .column_as(order_items::Column::Tax.sum(), "total_tax")
            .column_as(order_items::Column::Discount.sum(), "total_discount")
            .group_by(ord::Column::OrderType)
            .into_tuple::<(String, Option<Decimal>, Option<Decimal>, Option<Decimal>)>()
            .all(db_conn)
            .await?;

        // ========================================
        // 1b. Income/Outcome по категориям товаров (топливо vs товары)
        //     Группируем по order_type + product_type
        // ========================================
        let income_outcome_by_category_query = order_items::Entity::find()
            .join(JoinType::InnerJoin, order_items::Relation::Orders.def())
            .join(JoinType::InnerJoin, order_items::Relation::Products.def())
            .filter(
                ord::Column::OrderType.is_in(["Income", "Outcome"]),
            );

        let income_outcome_by_category_query = apply_totals_filters(income_outcome_by_category_query);

        let income_outcome_by_category = income_outcome_by_category_query
            .select_only()
            .column(ord::Column::OrderType)
            .column(entity::products::Column::ProductType)
            .column_as(order_items::Column::Cost.sum(), "total_sum")
            .column_as(order_items::Column::Tax.sum(), "total_tax")
            .column_as(order_items::Column::Discount.sum(), "total_discount")
            .group_by(ord::Column::OrderType)
            .group_by(entity::products::Column::ProductType)
            .into_tuple::<(String, String, Option<Decimal>, Option<Decimal>, Option<Decimal>)>()
            .all(db_conn)
            .await?;

        // ========================================
        // 2. Totals для SaleDispenser заказов - ТОПЛИВО
        //    (order_items с fueling_order записью)
        // ========================================
        let dispenser_fuel_query = order_items::Entity::find()
            .join(JoinType::InnerJoin, order_items::Relation::Orders.def())
            .join(
                JoinType::InnerJoin,
                order_items::Relation::FuelingOrder.def(),
            )
            .filter(ord::Column::OrderType.eq("SaleDispenser"));

        let dispenser_fuel_query = apply_totals_filters(dispenser_fuel_query);

        let dispenser_fuel_totals = dispenser_fuel_query
            .select_only()
            .column_as(order_items::Column::Cost.sum(), "total_sum")
            .column_as(order_items::Column::Tax.sum(), "total_tax")
            .column_as(order_items::Column::Discount.sum(), "total_discount")
            .into_tuple::<(Option<Decimal>, Option<Decimal>, Option<Decimal>)>()
            .one(db_conn)
            .await?
            .unwrap_or((None, None, None));

        // ========================================
        // 3. Totals для SaleDispenser заказов - ТОВАРЫ
        //    (order_items БЕЗ fueling_order записи)
        // ========================================
        let dispenser_goods_query = order_items::Entity::find()
            .join(JoinType::InnerJoin, order_items::Relation::Orders.def())
            .join(
                JoinType::LeftJoin,
                order_items::Relation::FuelingOrder.def(),
            )
            .filter(ord::Column::OrderType.eq("SaleDispenser"))
            .filter(entity::fueling_order::Column::Id.is_null());

        let dispenser_goods_query = apply_totals_filters(dispenser_goods_query);

        let dispenser_goods_totals = dispenser_goods_query
            .select_only()
            .column_as(order_items::Column::Cost.sum(), "total_sum")
            .column_as(order_items::Column::Tax.sum(), "total_tax")
            .column_as(order_items::Column::Discount.sum(), "total_discount")
            .into_tuple::<(Option<Decimal>, Option<Decimal>, Option<Decimal>)>()
            .one(db_conn)
            .await?
            .unwrap_or((None, None, None));

        // Initialize totals
        let mut order_type_totals = OrderTypeTotals {
            income_sum: Decimal::ZERO,
            income_tax: Decimal::ZERO,
            income_discount: Decimal::ZERO,
            outcome_sum: Decimal::ZERO,
            outcome_tax: Decimal::ZERO,
            outcome_discount: Decimal::ZERO,
            sale_sum: Decimal::ZERO,
            sale_tax: Decimal::ZERO,
            sale_discount: Decimal::ZERO,
            sale_dispenser_sum: Decimal::ZERO,
            sale_dispenser_tax: Decimal::ZERO,
            sale_dispenser_discount: Decimal::ZERO,
            returns_sum: Decimal::ZERO,
            returns_tax: Decimal::ZERO,
            returns_discount: Decimal::ZERO,
            // Product category breakdown
            income_fuel_sum: Decimal::ZERO,
            income_fuel_tax: Decimal::ZERO,
            income_fuel_discount: Decimal::ZERO,
            income_goods_sum: Decimal::ZERO,
            income_goods_tax: Decimal::ZERO,
            income_goods_discount: Decimal::ZERO,
            outcome_fuel_sum: Decimal::ZERO,
            outcome_fuel_tax: Decimal::ZERO,
            outcome_fuel_discount: Decimal::ZERO,
            outcome_goods_sum: Decimal::ZERO,
            outcome_goods_tax: Decimal::ZERO,
            outcome_goods_discount: Decimal::ZERO,
        };

        // Заполняем из НЕ-SaleDispenser заказов
        for (order_type_str, sum_opt, tax_opt, discount_opt) in non_dispenser_totals {
            let sum = sum_opt.unwrap_or_default();
            let tax = tax_opt.unwrap_or_default();
            let discount = discount_opt.unwrap_or_default();

            if let Ok(order_type) = OrderType::from_str(&order_type_str) {
                match order_type {
                    OrderType::Income => {
                        order_type_totals.income_sum = sum;
                        order_type_totals.income_tax = tax;
                        order_type_totals.income_discount = discount;
                    }
                    OrderType::Outcome => {
                        order_type_totals.outcome_sum = sum;
                        order_type_totals.outcome_tax = tax;
                        order_type_totals.outcome_discount = discount;
                    }
                    OrderType::Sale => {
                        order_type_totals.sale_sum = sum;
                        order_type_totals.sale_tax = tax;
                        order_type_totals.sale_discount = discount;
                    }
                    OrderType::Returns => {
                        order_type_totals.returns_sum = sum;
                        order_type_totals.returns_tax = tax;
                        order_type_totals.returns_discount = discount;
                    }
                    OrderType::SaleDispenser => {
                        // Этот случай не должен возникнуть, т.к. мы фильтруем
                    }
                }
            }
        }

        // Заполняем разбивку Income/Outcome по категориям товаров
        for (order_type_str, product_type_str, sum_opt, tax_opt, discount_opt) in income_outcome_by_category {
            let sum = sum_opt.unwrap_or_default();
            let tax = tax_opt.unwrap_or_default();
            let discount = discount_opt.unwrap_or_default();

            let is_fuel = product_type_str == "FuelLiquid" || product_type_str == "FuelGaseous";

            if let Ok(order_type) = OrderType::from_str(&order_type_str) {
                match (order_type, is_fuel) {
                    (OrderType::Income, true) => {
                        order_type_totals.income_fuel_sum += sum;
                        order_type_totals.income_fuel_tax += tax;
                        order_type_totals.income_fuel_discount += discount;
                    }
                    (OrderType::Income, false) => {
                        order_type_totals.income_goods_sum += sum;
                        order_type_totals.income_goods_tax += tax;
                        order_type_totals.income_goods_discount += discount;
                    }
                    (OrderType::Outcome, true) => {
                        order_type_totals.outcome_fuel_sum += sum;
                        order_type_totals.outcome_fuel_tax += tax;
                        order_type_totals.outcome_fuel_discount += discount;
                    }
                    (OrderType::Outcome, false) => {
                        order_type_totals.outcome_goods_sum += sum;
                        order_type_totals.outcome_goods_tax += tax;
                        order_type_totals.outcome_goods_discount += discount;
                    }
                    _ => {}
                }
            }
        }

        // Заполняем SaleDispenser - топливо
        order_type_totals.sale_dispenser_sum = dispenser_fuel_totals.0.unwrap_or_default();
        order_type_totals.sale_dispenser_tax = dispenser_fuel_totals.1.unwrap_or_default();
        order_type_totals.sale_dispenser_discount = dispenser_fuel_totals.2.unwrap_or_default();

        // Товары из SaleDispenser добавляем к обычным продажам (Sale)
        order_type_totals.sale_sum += dispenser_goods_totals.0.unwrap_or_default();
        order_type_totals.sale_tax += dispenser_goods_totals.1.unwrap_or_default();
        order_type_totals.sale_discount += dispenser_goods_totals.2.unwrap_or_default();

        // Money coming IN (positive cash flow): Sales + Fuel Sales + Returns to Provider
        let total_incoming = order_type_totals.sale_sum
            + order_type_totals.sale_tax
            + order_type_totals.sale_dispenser_sum
            + order_type_totals.sale_dispenser_tax
            + order_type_totals.outcome_sum
            + order_type_totals.outcome_tax;

        // Money going OUT (negative cash flow): Purchases + Customer Returns
        let total_outgoing = order_type_totals.income_sum
            + order_type_totals.income_tax
            + order_type_totals.returns_sum
            + order_type_totals.returns_tax;

        // Net cash flow = incoming - outgoing
        let total_sum = total_incoming - total_outgoing;

        let total_tax = -order_type_totals.income_tax
            + order_type_totals.outcome_tax
            + order_type_totals.sale_tax
            + order_type_totals.sale_dispenser_tax
            - order_type_totals.returns_tax;

        let total_discount = -order_type_totals.income_discount
            + order_type_totals.outcome_discount
            + order_type_totals.sale_discount
            + order_type_totals.sale_dispenser_discount
            - order_type_totals.returns_discount;

        let meta = OrderMovementSummaryMeta {
            total_sum,
            total_tax,
            total_discount,
            total_incoming,
            total_outgoing,
            totals_by_type: order_type_totals,
        };

        Ok(MetaPaginatorDTO {
            items: result,
            page: page as u32,
            count: num_items_and_pages.number_of_items as u32,
            limit: per_page as u32,
            page_count: num_items_and_pages.number_of_pages as u32,
            meta,
        })
    }

    async fn get_by_id(db: Arc<DataStore>, order_id: String) -> Result<OrderEntity> {
        let db_conn = db.get_db()?;
        let order = ord::Entity::find_by_id(order_id)
            .one(db_conn)
            .await?
            .ok_or(Error::Dispenser("order_not_found".to_owned()))?;

        let items = OrderItemRepository::get_order_items(db.clone(), order.id.clone()).await?;
        super::shared::into_entity(db, order, items).await
    }

    async fn fetch_active_orders(db: Arc<DataStore>) -> Result<Vec<OrderEntity>> {
        let db_conn = db.get_db()?;
        let orders_list = ord::Entity::find()
            .filter(ord::Column::DMove.is_null())
            .order_by(ord::Column::DCreated, sea_orm::Order::Desc)
            .all(db_conn)
            .await?;

        if orders_list.is_empty() {
            return Ok(vec![]);
        }

        let orders = build_orders_with_items(db, orders_list, 8).await?;
        Ok(orders)
    }
}

/// Унифицированная сборка OrderEntity:
/// - использует batch запрос для получения всех order items за один раз
/// - batch загрузка clients и payments (убирает N+1)
async fn build_orders_with_items(
    db: Arc<DataStore>,
    orders: Vec<ord::Model>,
    _concurrency_limit: usize,
) -> Result<Vec<OrderEntity>> {
    if orders.is_empty() {
        return Ok(Vec::new());
    }

    // Собираем все order_ids
    let order_ids: Vec<String> = orders.iter().map(|o| o.id.clone()).collect();

    // Собираем все client_ids (уникальные, без None)
    let client_ids: Vec<String> = orders
        .iter()
        .filter_map(|o| o.client_id.clone())
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();

    // Batch запросы: order items, clients, payments — параллельно
    let (items_map, clients_map, payments_map) = try_join!(
        OrderItemRepository::get_orders_items_batch(db.clone(), &order_ids),
        ClientRepository::get_by_ids(db.clone(), client_ids),
        PaymentRepository::get_orders_payments_batch(db.clone(), &order_ids),
    )?;

    // Собираем OrderEntity используя pre-loaded данные (0 запросов в цикле)
    let mut result = Vec::with_capacity(orders.len());
    for model in orders {
        let items = items_map.get(&model.id).cloned().unwrap_or_default();
        let order =
            super::shared::into_entity_with_preloaded(model, items, &clients_map, &payments_map);
        result.push(order);
    }

    Ok(result)
}
