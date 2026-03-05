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
                    .table(Cameras::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Cameras::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Cameras::CameraType).string().not_null())
                    .col(ColumnDef::new(Cameras::Name).string().not_null())
                    .col(ColumnDef::new(Cameras::Address).string().not_null())
                    .col(ColumnDef::new(Cameras::DeviceId).string().not_null())

                    // Sync metadata
                    .col(
                        ColumnDef::new(Cameras::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Cameras::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Cameras::DeletedAt).string())
                    .col(
                        ColumnDef::new(Cameras::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .col(ColumnDef::new(Cameras::LastSyncedAt).string())
                    .foreign_key(

                        ForeignKey::create()

                            .name("fk_cameras_device_id")

                            .from(Cameras::Table, Cameras::DeviceId)

                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),

                    )

                    .to_owned(),
            )
            .await?;

        // Create indexes
        manager
            .create_index(
                Index::create()
                    .table(Cameras::Table)
                    .name("idx_cameras_updated_at")
                    .col(Cameras::UpdatedAt)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .table(Cameras::Table)
                    .name("idx_cameras_deleted_at")
                    .col(Cameras::DeletedAt)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Cameras::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(Iden)]
pub enum Cameras {
    Table,
    Id,
    CameraType,
    Name,
    Address,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
    LastSyncedAt,
}
