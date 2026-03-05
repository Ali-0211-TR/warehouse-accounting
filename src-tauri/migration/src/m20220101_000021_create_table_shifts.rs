use sea_orm_migration::prelude::*;

use crate::m20250210_000001_create_device_config::DeviceConfig;

use crate::m20220101_000027_create_table_users::Users;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Shifts::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Shifts::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Shifts::DOpen).timestamp().not_null())
                    .col(ColumnDef::new(Shifts::DataOpen).text().not_null())
                    .col(ColumnDef::new(Shifts::UserOpenId).string().not_null())
                    .col(ColumnDef::new(Shifts::DClose).timestamp())
                    .col(ColumnDef::new(Shifts::DataClose).text())
                    .col(ColumnDef::new(Shifts::UserCloseId).string())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_shifts_user_open_id")
                            .from(Shifts::Table, Shifts::UserOpenId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_shifts_user_close_id")
                            .from(Shifts::Table, Shifts::UserCloseId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .col(ColumnDef::new(Shifts::DeviceId).string().not_null())

                    // Sync metadata
                    .col(
                        ColumnDef::new(Shifts::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Shifts::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Shifts::DeletedAt).string())
                    .col(
                        ColumnDef::new(Shifts::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(

                        ForeignKey::create()

                            .name("fk_shifts_device_id")

                            .from(Shifts::Table, Shifts::DeviceId)

                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),

                    )

                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Shifts::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Shifts {
    Table,
    Id,
    DOpen,
    DataOpen,
    DClose,
    DataClose,
    UserOpenId,
    UserCloseId,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}
