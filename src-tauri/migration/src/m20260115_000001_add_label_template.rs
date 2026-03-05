use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .add_column(ColumnDef::new(DeviceConfig::LabelTemplate).text().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .drop_column(DeviceConfig::LabelTemplate)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum DeviceConfig {
    Table,
    LabelTemplate,
}
