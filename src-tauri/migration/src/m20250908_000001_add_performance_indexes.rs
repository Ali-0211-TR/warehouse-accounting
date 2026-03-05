use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // ===== ORDERS TABLE INDEXES =====

        // Primary date filtering index for orders
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_orders_d_created")
                    .table(Orders::Table)
                    .col(Orders::DCreated)
                    .to_owned(),
            )
            .await?;

        // Compound index for order type and creation date (shift reports)
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_orders_type_date")
                    .table(Orders::Table)
                    .col(Orders::OrderType)
                    .col(Orders::DCreated)
                    .to_owned(),
            )
            .await?;

        // Index for move date (completed orders)
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_orders_d_move")
                    .table(Orders::Table)
                    .col(Orders::DMove)
                    .to_owned(),
            )
            .await?;

        // Client-based filtering
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_orders_client_id")
                    .table(Orders::Table)
                    .col(Orders::ClientId)
                    .to_owned(),
            )
            .await?;

        // ===== ORDER ITEMS TABLE INDEXES =====

        // Order lookup for order items
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_order_items_order_id")
                    .table(OrderItems::Table)
                    .col(OrderItems::OrderId)
                    .to_owned(),
            )
            .await?;

        // Product lookup for order items
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_order_items_product_id")
                    .table(OrderItems::Table)
                    .col(OrderItems::ProductId)
                    .to_owned(),
            )
            .await?;

        // ===== FUELING ORDERS TABLE INDEXES =====

        // Date filtering for fueling orders
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_fueling_orders_d_created")
                    .table(FuelingOrder::Table)
                    .col(FuelingOrder::DCreated)
                    .to_owned(),
            )
            .await?;

        // Compound index for nozzle and date (performance critical)
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_fueling_orders_nozzle_date")
                    .table(FuelingOrder::Table)
                    .col(FuelingOrder::NozzleId)
                    .col(FuelingOrder::DCreated)
                    .to_owned(),
            )
            .await?;

        // Move date index for completed fueling orders
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_fueling_orders_d_move")
                    .table(FuelingOrder::Table)
                    .col(FuelingOrder::DMove)
                    .to_owned(),
            )
            .await?;

        // Order item lookup for fueling orders
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_fueling_orders_order_item_id")
                    .table(FuelingOrder::Table)
                    .col(FuelingOrder::OrderItemId)
                    .to_owned(),
            )
            .await?;

        // ===== SHIFTS TABLE INDEXES =====

        // Shift open date index
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_shifts_d_open")
                    .table(Shifts::Table)
                    .col(Shifts::DOpen)
                    .to_owned(),
            )
            .await?;

        // Shift close date index
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_shifts_d_close")
                    .table(Shifts::Table)
                    .col(Shifts::DClose)
                    .to_owned(),
            )
            .await?;

        // User who opened shift index
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_shifts_user_open_id")
                    .table(Shifts::Table)
                    .col(Shifts::UserOpenId)
                    .to_owned(),
            )
            .await?;

        // ===== PRODUCTS TABLE INDEXES =====

        // Product name search index
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_products_name")
                    .table(Products::Table)
                    .col(Products::Name)
                    .to_owned(),
            )
            .await?;

        // Product category filtering
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_products_category")
                    .table(Products::Table)
                    .col(Products::Category)
                    .to_owned(),
            )
            .await?;

        // ===== NOZZLES TABLE INDEXES =====

        // Dispenser lookup for nozzles
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_nozzles_dispenser_id")
                    .table(Nozzles::Table)
                    .col(Nozzles::DispenserId)
                    .to_owned(),
            )
            .await?;

        // Tank lookup for nozzles
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_nozzles_tank_id")
                    .table(Nozzles::Table)
                    .col(Nozzles::TankId)
                    .to_owned(),
            )
            .await?;

        // Address lookup for nozzles
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_nozzles_address")
                    .table(Nozzles::Table)
                    .col(Nozzles::Address)
                    .to_owned(),
            )
            .await?;

        // ===== DISPENSERS TABLE INDEXES =====

        // Dispenser name search
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_dispensers_name")
                    .table(Dispensers::Table)
                    .col(Dispensers::Name)
                    .to_owned(),
            )
            .await?;

        // ===== CLIENTS TABLE INDEXES =====

        // Client company search
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_clients_company")
                    .table(Clients::Table)
                    .col(Clients::Company)
                    .to_owned(),
            )
            .await?;

        // ===== TANKS TABLE INDEXES =====

        // Tank name search
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_tanks_name")
                    .table(Tanks::Table)
                    .col(Tanks::Name)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Tanks indexes
        manager
            .drop_index(Index::drop().name("idx_tanks_name").to_owned())
            .await?;

        // Clients indexes
        manager
            .drop_index(Index::drop().name("idx_clients_company").to_owned())
            .await?;

        // Dispensers indexes
        manager
            .drop_index(Index::drop().name("idx_dispensers_name").to_owned())
            .await?;

        // Nozzles indexes
        manager
            .drop_index(Index::drop().name("idx_nozzles_address").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_nozzles_tank_id").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_nozzles_dispenser_id").to_owned())
            .await?;

        // Products indexes
        manager
            .drop_index(Index::drop().name("idx_products_category").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_products_name").to_owned())
            .await?;

        // Shifts indexes
        manager
            .drop_index(Index::drop().name("idx_shifts_user_open_id").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_shifts_d_close").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_shifts_d_open").to_owned())
            .await?;

        // Fueling orders indexes
        manager
            .drop_index(Index::drop().name("idx_fueling_orders_order_item_id").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_fueling_orders_d_move").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_fueling_orders_nozzle_date").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_fueling_orders_d_created").to_owned())
            .await?;

        // Order items indexes
        manager
            .drop_index(Index::drop().name("idx_order_items_product_id").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_order_items_order_id").to_owned())
            .await?;

        // Orders indexes
        manager
            .drop_index(Index::drop().name("idx_orders_client_id").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_orders_d_move").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_orders_type_date").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_orders_d_created").to_owned())
            .await?;

        Ok(())
    }
}

// Table definitions for the migration
#[derive(Iden)]
enum Orders {
    Table,
    DCreated,
    OrderType,
    DMove,
    ClientId,
}

#[derive(Iden)]
enum OrderItems {
    Table,
    OrderId,
    ProductId,
}

#[derive(Iden)]
enum FuelingOrder {
    Table,
    DCreated,
    DMove,
    NozzleId,
    OrderItemId,
}

#[derive(Iden)]
enum Shifts {
    Table,
    DOpen,
    DClose,
    UserOpenId,
}

#[derive(Iden)]
enum Products {
    Table,
    Name,
    Category,
}

#[derive(Iden)]
enum Nozzles {
    Table,
    DispenserId,
    TankId,
    Address,
}

#[derive(Iden)]
enum Dispensers {
    Table,
    Name,
}

#[derive(Iden)]
enum Clients {
    Table,
    Company,
}

#[derive(Iden)]
enum Tanks {
    Table,
    Name,
}
