use sea_orm_migration::prelude::*;

use crate::{
    m20220101_000013_create_table_marks::Marks,
    m20220101_000025_create_table_units::Units,
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
                    .table(Products::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Products::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Products::Name).string().not_null())
                    .col(ColumnDef::new(Products::ShortName).string().not_null())
                    .col(ColumnDef::new(Products::ProductType).string().not_null())
                    .col(ColumnDef::new(Products::UnitId).string().not_null())
                    .col(
                        ColumnDef::new(Products::BarCode)
                            .string()
                            .unique_key()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Products::Article)
                            .string()
                            .unique_key()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Products::Balance).decimal().not_null())
                    .col(ColumnDef::new(Products::GroupId).string().not_null())
                    .col(ColumnDef::new(Products::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Products::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Products::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Products::DeletedAt).string())
                    .col(
                        ColumnDef::new(Products::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-products-unit_id")
                            .from(Products::Table, Products::UnitId)
                            .to(Units::Table, Units::Id),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-products-group_id")
                            .from(Products::Table, Products::GroupId)
                            .to(Groups::Table, Groups::Id),
                    )

                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_products_device_id")
                            .from(Products::Table, Products::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Prices::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Prices::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Prices::ProductId).string().not_null())
                    .col(ColumnDef::new(Prices::StartTime).timestamp().not_null())
                    .col(ColumnDef::new(Prices::Value).decimal().not_null())
                    .col(ColumnDef::new(Prices::PriceType).string().not_null())
                    .col(ColumnDef::new(Prices::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Prices::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Prices::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Prices::DeletedAt).string())
                    .col(
                        ColumnDef::new(Prices::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-price-product_id")
                            .from(Prices::Table, Prices::ProductId)
                            .to(Products::Table, Products::Id),
                    )

                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_prices_device_id")
                            .from(Prices::Table, Prices::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Discounts::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Discounts::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Discounts::Name).string_len(100).not_null())
                    .col(
                        ColumnDef::new(Discounts::DiscountType)
                            .string_len(100)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Discounts::DiscountBoundType)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Discounts::DiscountUnitType)
                            .string()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Discounts::ProductType).string().null())
                    .col(ColumnDef::new(Discounts::Bound).decimal().not_null())
                    .col(ColumnDef::new(Discounts::Value).decimal().not_null())
                    .col(
                        ColumnDef::new(Discounts::OrderType)
                            .string()
                            .not_null()
                            .default("Sale"),
                    )
                    .col(ColumnDef::new(Discounts::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Discounts::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Discounts::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Discounts::DeletedAt).string())
                    .col(
                        ColumnDef::new(Discounts::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )

                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_discounts_device_id")
                            .from(Discounts::Table, Discounts::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Groups::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Groups::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Groups::GroupType).string().not_null())
                    .col(ColumnDef::new(Groups::MarkId).string().null())
                    .col(ColumnDef::new(Groups::Name).string().not_null())
                    .col(ColumnDef::new(Groups::ParentId).string().null())
                    .col(ColumnDef::new(Groups::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Groups::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Groups::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Groups::DeletedAt).string())
                    .col(
                        ColumnDef::new(Groups::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_group_mark")
                            .from(Groups::Table, Groups::MarkId)
                            .to(Marks::Table, Marks::Id),
                    )

                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_groups_device_id")
                            .from(Groups::Table, Groups::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(DiscountToGroup::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(DiscountToGroup::DiscountId)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(DiscountToGroup::GroupId)
                            .string()
                            .not_null(),
                    )
                    .primary_key(
                        Index::create()
                            .table(DiscountToGroup::Table)
                            .col(DiscountToGroup::DiscountId)
                            .col(DiscountToGroup::GroupId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(DiscountToGroup::Table, DiscountToGroup::DiscountId)
                            .to(Discounts::Table, Discounts::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(DiscountToGroup::Table, DiscountToGroup::GroupId)
                            .to(Groups::Table, Groups::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(DiscountToProduct::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(DiscountToProduct::DiscountId)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(DiscountToProduct::ProductId)
                            .string()
                            .not_null(),
                    )
                    .primary_key(
                        Index::create()
                            .table(DiscountToProduct::Table)
                            .col(DiscountToProduct::DiscountId)
                            .col(DiscountToProduct::ProductId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(DiscountToProduct::Table, DiscountToProduct::DiscountId)
                            .to(Discounts::Table, Discounts::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(DiscountToProduct::Table, DiscountToProduct::ProductId)
                            .to(Prices::Table, Prices::Id)
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
            .drop_table(Table::drop().table(Products::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Prices::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(Discounts::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(Groups::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(DiscountToGroup::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(DiscountToProduct::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(Iden)]
pub enum Products {
    Table,
    Id,
    Name,
    ShortName,
    ProductType,
    UnitId,
    BarCode,
    Article,
    Balance,
    GroupId,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}

#[derive(Iden)]
pub enum Prices {
    Table,
    Id,
    ProductId,
    StartTime,
    Value,
    PriceType,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}

#[derive(Iden)]
pub enum Discounts {
    Table,
    Id,
    Name,
    DiscountType,
    DiscountBoundType,
    DiscountUnitType,
    OrderType,
    ProductType,
    Bound,
    Value,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}

#[derive(Iden)]
pub enum Groups {
    Table,
    Id,
    GroupType,
    MarkId,
    Name,
    ParentId,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}

#[derive(Iden)]
pub enum DiscountToGroup {
    Table,
    DiscountId,
    GroupId,
}

#[derive(Iden)]
pub enum DiscountToProduct {
    Table,
    DiscountId,
    ProductId,
}
