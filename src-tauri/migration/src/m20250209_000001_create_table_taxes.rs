use sea_orm_migration::prelude::*;

use crate::m20250210_000001_create_device_config::DeviceConfig;

use crate::m20220101_000019_create_table_products::Products;
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Taxes::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Taxes::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Taxes::Name).string().not_null())
                    .col(ColumnDef::new(Taxes::ShortName).string_len(10).not_null())
                    .col(ColumnDef::new(Taxes::Rate).decimal().not_null())
                    .col(ColumnDef::new(Taxes::IsInclusive).boolean().not_null())
                    .col(ColumnDef::new(Taxes::DBegin).timestamp().not_null())
                    .col(
                        ColumnDef::new(Taxes::OrderType)
                            .string()
                            .not_null()
                            .default("Sale"),
                    )
                    .col(ColumnDef::new(Taxes::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Taxes::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Taxes::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Taxes::DeletedAt).string())
                    .col(
                        ColumnDef::new(Taxes::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_taxes_device_id")
                            .from(Taxes::Table, Taxes::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(TaxToProduct::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(TaxToProduct::TaxId).string().not_null())
                    .col(ColumnDef::new(TaxToProduct::ProductId).string().not_null())
                    .primary_key(
                        Index::create()
                            .table(TaxToProduct::Table)
                            .col(TaxToProduct::TaxId)
                            .col(TaxToProduct::ProductId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(TaxToProduct::Table, TaxToProduct::TaxId)
                            .to(Taxes::Table, Taxes::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(TaxToProduct::Table, TaxToProduct::ProductId)
                            .to(Products::Table, Products::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Taxes::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(TaxToProduct::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(Iden)]
pub enum Taxes {
    Table,
    Id,
    Name,
    ShortName,
    Rate,
    IsInclusive,
    DBegin,
    OrderType,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}

#[derive(Iden)]
pub enum TaxToProduct {
    Table,
    TaxId,
    ProductId,
}
