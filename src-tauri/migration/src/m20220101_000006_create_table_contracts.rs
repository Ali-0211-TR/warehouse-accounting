use sea_orm_migration::prelude::*;

use crate::{
    m20220101_000004_create_table_clients::Clients,
    m20220101_000019_create_table_products::{Discounts, Products},
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
                    .table(Contracts::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Contracts::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Contracts::ClientId).string().not_null())
                    .col(ColumnDef::new(Contracts::Name).string().not_null())
                    .col(ColumnDef::new(Contracts::ContractName).string().not_null())
                    .col(ColumnDef::new(Contracts::DBegin).timestamp().not_null())
                    .col(ColumnDef::new(Contracts::DEnd).timestamp().not_null())
                    .col(ColumnDef::new(Contracts::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Contracts::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Contracts::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Contracts::DeletedAt).string())
                    .col(
                        ColumnDef::new(Contracts::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_contracts_client_id")
                            .from(Contracts::Table, Contracts::ClientId)
                            .to(Clients::Table, Clients::Id),
                    )

                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_contracts_device_id")
                            .from(Contracts::Table, Contracts::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await?;
        manager
            .create_table(
                Table::create()
                    .table(ContractProducts::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ContractProducts::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(ContractProducts::ContractId)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(ContractProducts::ProductId)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(ContractProducts::Article)
                            .integer()
                            .not_null(),
                    )
                    .col(ColumnDef::new(ContractProducts::Count).decimal().not_null())
                    .col(
                        ColumnDef::new(ContractProducts::DiscountId)
                            .string()
                            .null(),
                    )
                    .col(ColumnDef::new(ContractProducts::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(ContractProducts::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(ContractProducts::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(ContractProducts::DeletedAt).string())
                    .col(
                        ColumnDef::new(ContractProducts::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_contract_products_contract_id")
                            .from(ContractProducts::Table, ContractProducts::ContractId)
                            .to(Contracts::Table, Contracts::Id),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_contract_products_product_id")
                            .from(ContractProducts::Table, ContractProducts::ProductId)
                            .to(Products::Table, Products::Id),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_contract_products_discount_id")
                            .from(ContractProducts::Table, ContractProducts::DiscountId)
                            .to(Discounts::Table, Discounts::Id),
                    )

                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_contractproducts_device_id")
                            .from(ContractProducts::Table, ContractProducts::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(ContractCars::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ContractCars::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(ContractCars::ContractId)
                            .string()
                            .not_null(),
                    )
                    .col(ColumnDef::new(ContractCars::Name).string().not_null())
                    .col(ColumnDef::new(ContractCars::Comment).string().not_null())
                    .col(ColumnDef::new(ContractCars::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(ContractCars::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(ContractCars::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(ContractCars::DeletedAt).string())
                    .col(
                        ColumnDef::new(ContractCars::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_cars_contract_id")
                            .from(ContractCars::Table, ContractCars::ContractId)
                            .to(Contracts::Table, Contracts::Id),
                    )

                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_contractcars_device_id")
                            .from(ContractCars::Table, ContractCars::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(ContractProducts::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(Contracts::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(ContractCars::Table).to_owned())
            .await?;
        Ok(())
    }
}
#[derive(Iden)]
pub enum Contracts {
    Table,
    Id,
    ClientId,
    Name,
    ContractName,
    DBegin,
    DEnd,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}

#[derive(Iden)]
pub enum ContractProducts {
    Table,
    Id,
    ContractId,
    ProductId,
    Article,
    Count,
    DiscountId,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}

#[derive(Iden)]
pub enum ContractCars {
    Table,
    Id,
    ContractId,
    Name,
    Comment,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}
