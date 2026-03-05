use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Add company_phone
        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .add_column(ColumnDef::new(DeviceConfig::CompanyPhone).string())
                    .to_owned(),
            )
            .await?;

        // Add company_email
        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .add_column(ColumnDef::new(DeviceConfig::CompanyEmail).string())
                    .to_owned(),
            )
            .await?;

        // Add company_website
        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .add_column(ColumnDef::new(DeviceConfig::CompanyWebsite).string())
                    .to_owned(),
            )
            .await?;

        // Add receipt_footer
        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .add_column(ColumnDef::new(DeviceConfig::ReceiptFooter).text())
                    .to_owned(),
            )
            .await?;

        // Add receipt_template_58mm
        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .add_column(ColumnDef::new(DeviceConfig::ReceiptTemplate58mm).text())
                    .to_owned(),
            )
            .await?;

        // Add receipt_template_80mm
        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .add_column(ColumnDef::new(DeviceConfig::ReceiptTemplate80mm).text())
                    .to_owned(),
            )
            .await?;

        // Add qr_code_url
        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .add_column(ColumnDef::new(DeviceConfig::QrCodeUrl).string())
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .drop_column(DeviceConfig::CompanyPhone)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .drop_column(DeviceConfig::CompanyEmail)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .drop_column(DeviceConfig::CompanyWebsite)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .drop_column(DeviceConfig::ReceiptFooter)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .drop_column(DeviceConfig::ReceiptTemplate58mm)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .drop_column(DeviceConfig::ReceiptTemplate80mm)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(DeviceConfig::Table)
                    .drop_column(DeviceConfig::QrCodeUrl)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(Iden)]
pub enum DeviceConfig {
    Table,
    CompanyPhone,
    CompanyEmail,
    CompanyWebsite,
    ReceiptFooter,
    ReceiptTemplate58mm,
    ReceiptTemplate80mm,
    QrCodeUrl,
}
