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
                    .table(Tanks::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Tanks::Id).string().not_null().primary_key())
                    .col(ColumnDef::new(Tanks::Name).string().not_null())
                    .col(
                        ColumnDef::new(Tanks::Protocol)
                            .string()
                            .default("".to_string()),
                    )
                    .col(
                        ColumnDef::new(Tanks::Address)
                            .tiny_unsigned()
                            .default(Value::TinyUnsigned(Some(1))),
                    )
                    .col(
                        ColumnDef::new(Tanks::ServerAddress)
                            .string()
                            .default("".to_string()),
                    )
                    .col(
                        ColumnDef::new(Tanks::ServerPort)
                            .integer()
                            .default(Value::Int(None)),
                    )
                    .col(
                        ColumnDef::new(Tanks::PortName)
                            .string()
                            .default("".to_string()),
                    )
                    .col(
                        ColumnDef::new(Tanks::PortSpeed)
                            .integer()
                            .default(Value::Int(None)),
                    )
                    .col(ColumnDef::new(Tanks::Balance).decimal().not_null())
                    .col(ColumnDef::new(Tanks::VolumeMax).decimal().not_null())
                    .col(ColumnDef::new(Tanks::ProductId).string().not_null())
                    .col(ColumnDef::new(Tanks::DeviceId).string().not_null())

                    // Sync metadata
                    .col(
                        ColumnDef::new(Tanks::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Tanks::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Tanks::DeletedAt).string())
                    .col(
                        ColumnDef::new(Tanks::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_tank_product")
                            .from(Tanks::Table, Tanks::ProductId)
                            .to(Products::Table, Products::Id),
                    )
                    .foreign_key(

                        ForeignKey::create()

                            .name("fk_tanks_device_id")

                            .from(Tanks::Table, Tanks::DeviceId)

                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),

                    )

                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Tanks::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(Iden)]
pub enum Tanks {
    Table,
    Id,
    Name,
    Protocol,
    Address,
    ServerAddress,
    ServerPort,
    PortName,
    PortSpeed,
    Balance,
    VolumeMax,
    ProductId,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}
