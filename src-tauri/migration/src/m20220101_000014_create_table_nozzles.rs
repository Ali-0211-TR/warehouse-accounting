use sea_orm_migration::prelude::*;

use crate::{
    m20220101_000011_create_table_dispensers::Dispensers,
    m20220101_000024_create_table_tanks::Tanks,
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
                    .table(Nozzles::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Nozzles::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Nozzles::DispenserId).string().not_null())
                    .col(
                        ColumnDef::new(Nozzles::Address)
                            .unique_key()
                            .integer()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Nozzles::TankId).string().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_nozzles_tank_id")
                            .from(Nozzles::Table, Nozzles::TankId)
                            .to(Tanks::Table, Tanks::Id),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_nozzles_dispenser_id")
                            .on_delete(ForeignKeyAction::Cascade)
                            .from(Nozzles::Table, Nozzles::DispenserId)
                            .to(Dispensers::Table, Dispensers::Id),
                    )
                    .col(ColumnDef::new(Nozzles::DeviceId).string().not_null())

                    // Sync metadata
                    .col(
                        ColumnDef::new(Nozzles::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Nozzles::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Nozzles::DeletedAt).string())
                    .col(
                        ColumnDef::new(Nozzles::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(

                        ForeignKey::create()

                            .name("fk_nozzles_device_id")

                            .from(Nozzles::Table, Nozzles::DeviceId)

                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),

                    )

                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Nozzles::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(Iden)]
pub enum Nozzles {
    Table,
    Id,
    DispenserId,
    Address,
    TankId,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}
