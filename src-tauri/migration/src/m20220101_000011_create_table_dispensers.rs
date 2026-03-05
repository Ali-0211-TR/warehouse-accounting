use sea_orm_migration::prelude::*;

use crate::m20220101_000010_create_table_dispenser_ports::DispenserPorts;
use crate::m20250210_000001_create_device_config::DeviceConfig;

use crate::m20220101_000001_create_table_cameras::Cameras;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Dispensers::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Dispensers::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Dispensers::Name).string().not_null())
                    .col(ColumnDef::new(Dispensers::BaseAddress).integer().not_null())
                    .col(ColumnDef::new(Dispensers::PortId).string().not_null())
                    .col(ColumnDef::new(Dispensers::CameraId).string().null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_dispensers_port_id")
                            .from(Dispensers::Table, Dispensers::PortId)
                            .to(DispenserPorts::Table, DispenserPorts::Id),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_camera_id")
                            .from(Dispensers::Table, Dispensers::CameraId)
                            .to(Cameras::Table, Cameras::Id),
                    )
                    .col(ColumnDef::new(Dispensers::State).string_len(100).not_null())
                    .col(ColumnDef::new(Dispensers::DeviceId).string().not_null())

                    // Sync metadata
                    .col(
                        ColumnDef::new(Dispensers::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Dispensers::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Dispensers::DeletedAt).string())
                    .col(
                        ColumnDef::new(Dispensers::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(

                        ForeignKey::create()

                            .name("fk_dispensers_device_id")

                            .from(Dispensers::Table, Dispensers::DeviceId)

                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),

                    )

                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Dispensers::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(Iden)]
pub enum Dispensers {
    Table,
    Id,
    Name,
    BaseAddress,
    PortId,
    CameraId,
    State,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}
