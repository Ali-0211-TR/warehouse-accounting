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
                    .table(Units::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Units::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Units::Name).string().not_null())
                    .col(ColumnDef::new(Units::ShortName).string().not_null())
                    .col(ColumnDef::new(Units::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Units::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Units::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Units::DeletedAt).string())
                    .col(
                        ColumnDef::new(Units::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .col(ColumnDef::new(Units::LastSyncedAt).string())
                    
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_units_device_id")
                            .from(Units::Table, Units::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await?;

        // Create indexes
        manager
            .create_index(
                Index::create()
                    .table(Units::Table)
                    .name("idx_units_updated_at")
                    .col(Units::UpdatedAt)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .table(Units::Table)
                    .name("idx_units_deleted_at")
                    .col(Units::DeletedAt)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Units::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(Iden)]
pub enum Units {
    Table,
    Id,
    Name,
    ShortName,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
    LastSyncedAt,
}
