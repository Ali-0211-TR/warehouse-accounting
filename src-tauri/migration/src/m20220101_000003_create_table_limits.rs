use sea_orm_migration::prelude::*;

use crate::m20220101_000019_create_table_products::{Discounts, Products};
use crate::{
    m20220101_000002_create_table_cards::Cards,
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
                    .table(Limits::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Limits::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Limits::CardId).string().not_null())
                    .col(ColumnDef::new(Limits::LimitType).string().not_null()) // Unlimited, Volume, Amount
                    .col(ColumnDef::new(Limits::ProductId).string().null()) // null means applies to all products
                    .col(ColumnDef::new(Limits::DBegin).timestamp().not_null()) // Start date of limit period
                    .col(ColumnDef::new(Limits::DEnd).timestamp().not_null()) // End date of limit period
                    .col(ColumnDef::new(Limits::IncludeHolidays).boolean().not_null().default(true)) // Whether limit applies on holidays
                    .col(ColumnDef::new(Limits::LimitValue).double().not_null().default(0.0)) // Volume or Amount limit value
                    .col(ColumnDef::new(Limits::DiscountId).string().null()) // Optional discount for this limit
                    .col(ColumnDef::new(Limits::Comment).string().not_null().default(""))
                    .col(ColumnDef::new(Limits::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Limits::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Limits::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Limits::DeletedAt).string())
                    .col(
                        ColumnDef::new(Limits::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_limits_card_id")
                            .from(Limits::Table, Limits::CardId)
                            .to(Cards::Table, Cards::Id)
                            .on_delete(ForeignKeyAction::Cascade), // Delete limits when card is deleted
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_limits_product_id")
                            .from(Limits::Table, Limits::ProductId)
                            .to(Products::Table, Products::Id)
                            .on_delete(ForeignKeyAction::SetNull), // Set to null if product is deleted
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_limits_discount_id")
                            .from(Limits::Table, Limits::DiscountId)
                            .to(Discounts::Table, Discounts::Id)
                            .on_delete(ForeignKeyAction::SetNull), // Set to null if discount is deleted
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_limits_device_id")
                            .from(Limits::Table, Limits::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await?;

        // Create indexes for better query performance
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_limits_card_id")
                    .table(Limits::Table)
                    .col(Limits::CardId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_limits_product_id")
                    .table(Limits::Table)
                    .col(Limits::ProductId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_limits_dates")
                    .table(Limits::Table)
                    .col(Limits::DBegin)
                    .col(Limits::DEnd)
                    .to_owned(),
            )
            .await?;

        // Note: SQLite doesn't support subqueries in CHECK constraints
        // This validation should be enforced at the application level
        // Keeping the code here for documentation purposes, but commented out
        //
        // manager
        //     .get_connection()
        //     .execute_unprepared(
        //         "ALTER TABLE limits ADD CONSTRAINT chk_limits_within_card_dates
        //          CHECK (
        //              d_begin >= (SELECT d_begin FROM cards WHERE id = card_id) AND
        //              d_end <= (SELECT d_end FROM cards WHERE id = card_id)
        //          )"
        //     )
        //     .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Limits::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Limits {
    Table,
    Id,
    CardId,
    LimitType,
    ProductId,
    DBegin,
    DEnd,
    IncludeHolidays,
    LimitValue,
    DiscountId,
    Comment,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}
