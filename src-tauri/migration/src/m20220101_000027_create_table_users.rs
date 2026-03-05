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
                    .table(Users::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Users::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Users::FullName).string().not_null())
                    .col(ColumnDef::new(Users::Username).string().not_null())
                    .col(ColumnDef::new(Users::Password).string().not_null())
                    .col(ColumnDef::new(Users::PhoneNumber).string().not_null())
                    .col(ColumnDef::new(Users::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Users::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Users::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Users::DeletedAt).string())
                    .col(
                        ColumnDef::new(Users::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_users_device_id")
                            .from(Users::Table, Users::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await?;
        manager
            .create_table(
                Table::create()
                    .table(Roles::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Roles::Id)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Roles::Name).string().not_null())
                    .col(ColumnDef::new(Roles::DeviceId).string().not_null())
                    // Sync metadata
                    .col(
                        ColumnDef::new(Roles::CreatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(
                        ColumnDef::new(Roles::UpdatedAt)
                            .string()
                            .not_null()
                            .default("CURRENT_TIMESTAMP"),
                    )
                    .col(ColumnDef::new(Roles::DeletedAt).string())
                    .col(
                        ColumnDef::new(Roles::Version)
                            .big_integer()
                            .not_null()
                            .default(1),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_roles_device_id")
                            .from(Roles::Table, Roles::DeviceId)
                            .to(DeviceConfig::Table, DeviceConfig::DeviceId),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(UserToRole::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(UserToRole::UserId).string().not_null())
                    .col(ColumnDef::new(UserToRole::RoleId).string().not_null())
                    .primary_key(
                        Index::create()
                            .table(UserToRole::Table)
                            .col(UserToRole::UserId)
                            .col(UserToRole::RoleId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(UserToRole::Table, UserToRole::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(UserToRole::Table, UserToRole::RoleId)
                            .to(Roles::Table, Roles::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Users::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Roles::Table).to_owned())
            .await?;
        Ok(())
    }
}

#[derive(Iden)]
pub enum Users {
    Table,
    Id,
    FullName,
    Username,
    Password,
    PhoneNumber,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}

#[derive(Iden)]
pub enum Roles {
    Table,
    Id,
    Name,
    DeviceId,
    CreatedAt,
    UpdatedAt,
    DeletedAt,
    Version,
}

#[derive(Iden)]
pub enum UserToRole {
    Table,
    UserId,
    RoleId,
}
