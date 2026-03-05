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
                    .table(DispenserPorts::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(DispenserPorts::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(DispenserPorts::Protocol).string().not_null())
                    .col(ColumnDef::new(DispenserPorts::PortName).string().not_null())
                    .col(
                        ColumnDef::new(DispenserPorts::PortSpeed)
                            .integer()
                            .not_null(),
                    )
                    .col(ColumnDef::new(DispenserPorts::DeviceId).string().not_null())

                    // Sync metadata
                    .col(
                        ColumnDef::new(DispenserPorts::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(DispenserPorts::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(DispenserPorts::DeletedAt).string())
                    .col(
                        ColumnDef::new(DispenserPorts::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(

                        ForeignKey::create()

                            .name("fk_dispenserports_device_id")

                            .from(DispenserPorts::Table, DispenserPorts::DeviceId)

                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),

                    )

                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(DispenserPorts::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(Iden)]
pub enum DispenserPorts {
    Table,
    Id,
    Protocol,
    PortName,
    PortSpeed,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}
