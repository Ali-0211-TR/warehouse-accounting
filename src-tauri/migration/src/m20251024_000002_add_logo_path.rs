use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Add logo_path column to device_config table
        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .add_column(
                        ColumnDef::new(DeviceConfig::LogoPath)
                            .string()
                            .null()
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Remove logo_path column
        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .drop_column(DeviceConfig::LogoPath)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum DeviceConfig {
    Table,
    LogoPath,
}
