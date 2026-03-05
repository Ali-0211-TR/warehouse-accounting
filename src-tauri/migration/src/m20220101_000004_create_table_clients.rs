use sea_orm_migration::prelude::*;

use crate::m20250210_000001_create_device_config::DeviceConfig;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Clients::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Clients::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Clients::ClientType).string().not_null())
                    .col(ColumnDef::new(Clients::Name).string().not_null())
                    .col(ColumnDef::new(Clients::NameShort).string().not_null())
                    .col(ColumnDef::new(Clients::DocumentCode).string())
                    .col(ColumnDef::new(Clients::Address).string())
                    .col(ColumnDef::new(Clients::TaxCode).string())
                    .col(ColumnDef::new(Clients::Bank).string())
                    .col(ColumnDef::new(Clients::Contact).string())
                    .col(
                        ColumnDef::new(Clients::Login)
                            .string()
                            .unique_key()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Clients::Password).string().not_null())
                    .col(ColumnDef::new(Clients::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Clients::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Clients::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Clients::DeletedAt).string())
                    .col(
                        ColumnDef::new(Clients::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )

                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_clients_device_id")
                            .from(Clients::Table, Clients::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Clients::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(Iden)]
pub enum Clients {
    Table,
    Id,
    ClientType,
    Name,
    NameShort,
    DocumentCode,
    Address,
    TaxCode,
    Bank,
    Contact,
    Login,
    Password,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}
