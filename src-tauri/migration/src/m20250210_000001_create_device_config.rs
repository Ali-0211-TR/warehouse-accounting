use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(DeviceConfig::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(DeviceConfig::Id)
                            .string()
                            .not_null()
                            .primary_key()
                            .default("singleton"),
                    )
                    .col(ColumnDef::new(DeviceConfig::DeviceUuid).string().not_null().unique_key())
                    .col(ColumnDef::new(DeviceConfig::DeviceId).string().unique_key())
                    .col(ColumnDef::new(DeviceConfig::DeviceName).string().not_null())
                    .col(ColumnDef::new(DeviceConfig::DeviceToken).string())
                    .col(ColumnDef::new(DeviceConfig::ServerUrl).string())
                    .col(ColumnDef::new(DeviceConfig::CompanyName).string())
                    .col(ColumnDef::new(DeviceConfig::CompanyTaxCode).string())
                    .col(ColumnDef::new(DeviceConfig::CompanyAddress).string())
                    .col(ColumnDef::new(DeviceConfig::StationName).string())
                    .col(ColumnDef::new(DeviceConfig::ShopName).string())
                    .col(ColumnDef::new(DeviceConfig::LicenseKey).string())
                    .col(ColumnDef::new(DeviceConfig::LicenseExpiry).string())
                    .col(ColumnDef::new(DeviceConfig::LastSyncAt).string())
                    .col(ColumnDef::new(DeviceConfig::IsRegistered).boolean().not_null().default(false))
                    .col(
                        ColumnDef::new(DeviceConfig::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(DeviceConfig::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(DeviceConfig::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum DeviceConfig {
    Table,
    Id,
    DeviceUuid,
    DeviceId,
    DeviceName,
    DeviceToken,
    ServerUrl,
    CompanyName,
    CompanyTaxCode,
    CompanyAddress,
    StationName,
    ShopName,
    LicenseKey,
    LicenseExpiry,
    LastSyncAt,
    IsRegistered,
    CreatedAt,
    UpdatedAt,
}
