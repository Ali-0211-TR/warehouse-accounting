use sea_orm_migration::prelude::*;

use crate::{
    m20220101_000004_create_table_clients::Clients,
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
                    .table(Cards::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Cards::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Cards::ClientId).string().null())
                    .col(ColumnDef::new(Cards::Name).string().not_null())
                    .col(ColumnDef::new(Cards::DBegin).timestamp().not_null())
                    .col(ColumnDef::new(Cards::DEnd).timestamp().not_null())
                    .col(ColumnDef::new(Cards::State).string().not_null())
                    .col(ColumnDef::new(Cards::Comment).string().not_null())
                    .col(ColumnDef::new(Cards::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Cards::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Cards::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Cards::DeletedAt).string())
                    .col(
                        ColumnDef::new(Cards::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_cards_client_id")
                            .from(Cards::Table, Cards::ClientId)
                            .to(Clients::Table, Clients::Id),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_cards_device_id")
                            .from(Cards::Table, Cards::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Cards::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Cards {
    Table,
    Id,
    ClientId,
    Name,
    DBegin,
    DEnd,
    State,
    Comment,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}
