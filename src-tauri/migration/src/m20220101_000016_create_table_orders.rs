use sea_orm_migration::prelude::*;

use crate::{
    m20220101_000001_create_table_cameras::Cameras,
    m20220101_000002_create_table_cards::Cards,
    m20220101_000004_create_table_clients::Clients,
    m20220101_000006_create_table_contracts::{ContractCars, ContractProducts, Contracts},
    m20220101_000014_create_table_nozzles::Nozzles,
    m20220101_000019_create_table_products::Products,
    m20250210_000001_create_device_config::DeviceConfig,
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Orders::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Orders::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Orders::OrderType).string().not_null())
                    .col(ColumnDef::new(Orders::DCreated).timestamp().not_null())
                    .col(ColumnDef::new(Orders::DMove).timestamp().null())
                    .col(ColumnDef::new(Orders::Summ).decimal().not_null())
                    .col(ColumnDef::new(Orders::Tax).decimal().not_null())
                    .col(ColumnDef::new(Orders::Discard).text().null())
                    .col(ColumnDef::new(Orders::ClientId).string().null())
                    .col(ColumnDef::new(Orders::ContractId).string().null())
                    .col(ColumnDef::new(Orders::ContractCarId).string().null())
                    .col(ColumnDef::new(Orders::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Orders::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Orders::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Orders::DeletedAt).string())
                    .col(
                        ColumnDef::new(Orders::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_orders_client_id")
                            .from(Orders::Table, Orders::ClientId)
                            .to(Clients::Table, Clients::Id),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_orders_contract_id")
                            .from(Orders::Table, Orders::ContractId)
                            .to(Contracts::Table, Contracts::Id),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_orders_contract_car_id")
                            .from(Orders::Table, Orders::ContractCarId)
                            .to(ContractCars::Table, ContractCars::Id),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_orders_device_id")
                            .from(Orders::Table, Orders::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_orders_client")
                    .table(Orders::Table)
                    .col(Orders::ClientId)
                    .to_owned(),
            )
            .await?;
        manager
            .create_index(
                Index::create()
                    .name("idx_orders_contract")
                    .table(Orders::Table)
                    .col(Orders::ContractId)
                    .to_owned(),
            )
            .await?;
        manager
            .create_index(
                Index::create()
                    .name("idx_orders_contract_car")
                    .table(Orders::Table)
                    .col(Orders::ContractCarId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Payments::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Payments::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Payments::OrderId).string().not_null())
                    .col(ColumnDef::new(Payments::PaymentType).string().not_null())
                    .col(ColumnDef::new(Payments::Summ).decimal().not_null())
                    .col(ColumnDef::new(Payments::Delivery).integer().not_null())
                    .col(ColumnDef::new(Payments::Transaction).string().not_null())
                    .col(ColumnDef::new(Payments::Ticket).string().not_null())
                    .col(ColumnDef::new(Payments::Discard).string())
                    .col(ColumnDef::new(Payments::Data).string().not_null())
                    .col(ColumnDef::new(Payments::CardId).string())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Payments::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Payments::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Payments::DeletedAt).string())
                    .col(
                        ColumnDef::new(Payments::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_payments_order_id")
                            .from(Payments::Table, Payments::OrderId)
                            .to(Orders::Table, Orders::Id),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_payments_card_id")
                            .from(Payments::Table, Payments::CardId)
                            .to(Cards::Table, Cards::Id),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(OrderItems::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(OrderItems::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(OrderItems::OrderId).string().not_null())
                    .col(ColumnDef::new(OrderItems::ProductId).string().not_null())
                    .col(ColumnDef::new(OrderItems::Count).decimal().not_null())
                    .col(ColumnDef::new(OrderItems::Price).decimal().not_null())
                    .col(ColumnDef::new(OrderItems::Discount).decimal().not_null())
                    .col(ColumnDef::new(OrderItems::Cost).decimal().not_null())
                    .col(ColumnDef::new(OrderItems::Tax).decimal().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(OrderItems::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(OrderItems::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(OrderItems::DeletedAt).string())
                    .col(
                        ColumnDef::new(OrderItems::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_order_items_order_id")
                            .from(OrderItems::Table, OrderItems::OrderId)
                            .to(Orders::Table, Orders::Id)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_order_items_product_id")
                            .from(OrderItems::Table, OrderItems::ProductId)
                            .to(Products::Table, Products::Id)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Photos::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Photos::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Photos::OrderId).string().not_null())
                    .col(ColumnDef::new(Photos::CameraId).string().not_null())
                    .col(ColumnDef::new(Photos::DCreated).timestamp().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_photos_order_id")
                            .from(Photos::Table, Photos::OrderId)
                            .to(Orders::Table, Orders::Id)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_photos_camera_id")
                            .from(Photos::Table, Photos::CameraId)
                            .to(Cameras::Table, Cameras::Id)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    // Sync metadata
                    .col(
                        ColumnDef::new(Photos::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Photos::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Photos::DeletedAt).string())
                    .col(
                        ColumnDef::new(Photos::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(OrderItemToContractProduct::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(OrderItemToContractProduct::OrderItemId)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(OrderItemToContractProduct::ContractProductId)
                            .string()
                            .not_null(),
                    )
                    .primary_key(
                        Index::create()
                            .table(OrderItemToContractProduct::Table)
                            .col(OrderItemToContractProduct::OrderItemId)
                            .col(OrderItemToContractProduct::ContractProductId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(
                                OrderItemToContractProduct::Table,
                                OrderItemToContractProduct::OrderItemId,
                            )
                            .to(OrderItems::Table, OrderItems::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(
                                OrderItemToContractProduct::Table,
                                OrderItemToContractProduct::ContractProductId,
                            )
                            .to(ContractProducts::Table, ContractProducts::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(FuelingOrder::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(FuelingOrder::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(FuelingOrder::Title)
                            .string_len(50)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(FuelingOrder::DCreated)
                            .timestamp()
                            .not_null(),
                    )
                    .col(ColumnDef::new(FuelingOrder::DMove).timestamp().null())
                    .col(
                        ColumnDef::new(FuelingOrder::OrderItemId)
                            .string()
                            .not_null()
                            .unique_key(),
                    )
                    .col(ColumnDef::new(FuelingOrder::NozzleId).string().not_null())
                    .col(
                        ColumnDef::new(FuelingOrder::PresetVolume)
                            .decimal()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(FuelingOrder::PresetAmount)
                            .decimal()
                            .not_null(),
                    )
                    .col(ColumnDef::new(FuelingOrder::Volume).decimal().not_null())
                    .col(ColumnDef::new(FuelingOrder::Amount).decimal().not_null())
                    .col(
                        ColumnDef::new(FuelingOrder::PresetType)
                            .string_len(100)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(FuelingOrder::FuelingType)
                            .string_len(100)
                            .not_null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_fueling_order_items_order_item_id")
                            .from(FuelingOrder::Table, FuelingOrder::OrderItemId)
                            .to(OrderItems::Table, OrderItems::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_order_items_fueling_nozzle_id")
                            .from(FuelingOrder::Table, FuelingOrder::NozzleId)
                            .to(Nozzles::Table, Nozzles::Id)
                            .on_delete(ForeignKeyAction::NoAction),
                    )
                    // Sync metadata
                    .col(
                        ColumnDef::new(FuelingOrder::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(FuelingOrder::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(FuelingOrder::DeletedAt).string())
                    .col(
                        ColumnDef::new(FuelingOrder::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_fueling_order_nozzle")
                    .table(FuelingOrder::Table)
                    .col(FuelingOrder::NozzleId)
                    .to_owned(),
            )
            .await?;
        manager
            .create_index(
                Index::create()
                    .unique()
                    .name("idx_fueling_order_order_item")
                    .table(FuelingOrder::Table)
                    .col(FuelingOrder::OrderItemId)
                    .to_owned(),
            )
            .await?;

        // Create order_item_taxes table
        manager
            .create_table(
                Table::create()
                    .table(OrderItemTaxes::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(OrderItemTaxes::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(OrderItemTaxes::OrderItemId)
                            .string()
                            .not_null(),
                    )
                    .col(ColumnDef::new(OrderItemTaxes::Name).string().not_null())
                    .col(ColumnDef::new(OrderItemTaxes::Value).decimal().not_null())
                    .col(ColumnDef::new(OrderItemTaxes::Rate).decimal().null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_order_item_taxes_order_item_id")
                            .from(OrderItemTaxes::Table, OrderItemTaxes::OrderItemId)
                            .to(OrderItems::Table, OrderItems::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create order_item_discounts table
        manager
            .create_table(
                Table::create()
                    .table(OrderItemDiscounts::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(OrderItemDiscounts::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(OrderItemDiscounts::OrderItemId)
                            .string()
                            .not_null(),
                    )
                    .col(ColumnDef::new(OrderItemDiscounts::Name).string().not_null())
                    .col(
                        ColumnDef::new(OrderItemDiscounts::Value)
                            .decimal()
                            .not_null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_order_item_discounts_order_item_id")
                            .from(OrderItemDiscounts::Table, OrderItemDiscounts::OrderItemId)
                            .to(OrderItems::Table, OrderItems::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(OrderItemDiscounts::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(OrderItemTaxes::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Photos::Table).to_owned())
            .await?;
        manager
            .drop_table(
                Table::drop()
                    .table(OrderItemToContractProduct::Table)
                    .to_owned(),
            )
            .await?;
        manager
            .drop_table(
                Table::drop()
                    .table(FuelingOrder::Table)
                    .table(OrderItems::Table)
                    .table(Payments::Table)
                    .table(Orders::Table)
                    .to_owned(),
            )
            .await?;
        Ok(())
    }
}

#[derive(Iden)]
pub enum Orders {
    Table,
    Id,
    OrderType,
    DCreated,
    DMove,
    Summ,
    Tax,
    Discard,
    ClientId,
    ContractId,
    ContractCarId,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}

#[derive(Iden)]
pub enum OrderItems {
    Table,
    Id,
    OrderId,
    ProductId,
    Count,
    Price,
    Discount,
    Cost,
    Tax,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}

#[derive(Iden)]
pub enum Payments {
    Table,
    Id,
    OrderId,
    PaymentType,
    Summ,
    Delivery,
    Transaction,
    Ticket,
    Discard,
    Data,
    CardId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}

#[derive(Iden)]
pub enum FuelingOrder {
    Id,
    Table,
    Title,
    DCreated,
    DMove,
    OrderItemId,
    NozzleId,
    PresetVolume,
    PresetAmount,
    Volume,
    Amount,
    PresetType,
    FuelingType,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}

#[derive(Iden)]
pub enum OrderItemToContractProduct {
    Table,
    OrderItemId,
    ContractProductId,
}

#[derive(Iden)]
pub enum Photos {
    Table,
    Id,
    DCreated,
    OrderId,
    CameraId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}

#[derive(Iden)]
pub enum OrderItemTaxes {
    Table,
    Id,
    OrderItemId,
    Name,
    Value,
    Rate,
}

#[derive(Iden)]
pub enum OrderItemDiscounts {
    Table,
    Id,
    OrderItemId,
    Name,
    Value,
}
