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
                    .table(Marks::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Marks::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Marks::Name).string().not_null())
                    .col(ColumnDef::new(Marks::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Marks::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Marks::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Marks::DeletedAt).string())
                    .col(
                        ColumnDef::new(Marks::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_marks_device_id")
                            .from(Marks::Table, Marks::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Marks::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Marks {
    Table,
    Id,
    Name,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}
