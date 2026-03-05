use sea_orm_migration::prelude::*;

use crate::{
    m20220101_000001_create_table_cameras::Cameras,
    m20220101_000013_create_table_marks::Marks,
    m20220101_000019_create_table_products::{Groups, Products},
    m20220101_000025_create_table_units::Units,
    m20220101_000027_create_table_users::{Roles, Users},
    m20250210_000001_create_device_config::DeviceConfig,
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        //=======Add device_config singleton (MUST BE FIRST)=====
        let insert = Query::insert()
            .into_table(DeviceConfig::Table)
            .columns([
                DeviceConfig::Id,
                DeviceConfig::DeviceUuid,
                DeviceConfig::DeviceId,
                DeviceConfig::DeviceName,
                DeviceConfig::ServerUrl,
                DeviceConfig::CompanyName,
                DeviceConfig::CompanyTaxCode,
                DeviceConfig::CompanyAddress,
                DeviceConfig::StationName,
                DeviceConfig::ShopName,
                DeviceConfig::IsRegistered,
            ])
            .values_panic([
                "singleton".into(),
                "dev-00000000-0000-0000-0000-000000000001".into(),
                "device-default-001".into(),
                "Development Device".into(),
                "http://localhost:3000".into(),
                "TexnoUz Company".into(),
                "123456789".into(),
                "Tashkent, Uzbekistan".into(),
                "Main Station".into(),
                "Shop #1".into(),
                false.into(),
            ])
            .to_owned();
        db.execute(db.get_database_backend().build(&insert))
            .await?;

        //=======Add roles=======
        let roles = [
            ("00000000-0000-0000-0000-000000000001", "Administrator"),
            ("00000000-0000-0000-0000-000000000002", "Manager"),
            ("00000000-0000-0000-0000-000000000003", "Seller"),
            ("00000000-0000-0000-0000-000000000004", "Operator"),
            ("00000000-0000-0000-0000-000000000005", "Remote"),
        ];

        let mut insert = Query::insert()
            .into_table(Roles::Table)
            .columns([Roles::Id, Roles::Name, Roles::DeviceId])
            .to_owned();

        for (id, name) in roles {
            insert.values_panic([
                id.into(),
                name.into(),
                "device-default-001".into(),
            ]);
        }

        db.execute(db.get_database_backend().build(&insert))
            .await?;

        //=======Add users=======
        let users = [
            ("00000000-0000-0000-0001-000000000001", "Administrator", "admin"),
            ("00000000-0000-0000-0001-000000000002", "Operator", "operator"),
        ];

        let mut insert = Query::insert()
            .into_table(Users::Table)
            .columns([
                Users::Id,
                Users::FullName,
                Users::Username,
                Users::Password,
                Users::PhoneNumber,
                Users::DeviceId,
            ])
            .to_owned();

        for (id, full_name, username) in users {
            insert.values_panic([
                id.into(),
                full_name.into(),
                username.into(),
                "".into(),
                "+998000000000".into(),
                "device-default-001".into(),
            ]);
        }

        db.execute(db.get_database_backend().build(&insert))
            .await?;

        //=======Add user_to_role mappings=======
        let user_roles = [
            ("00000000-0000-0000-0001-000000000001", "00000000-0000-0000-0000-000000000001"), // admin -> Administrator
            ("00000000-0000-0000-0001-000000000001", "00000000-0000-0000-0000-000000000003"), // admin -> Seller
            ("00000000-0000-0000-0001-000000000002", "00000000-0000-0000-0000-000000000003"), // operator -> Seller
            ("00000000-0000-0000-0001-000000000002", "00000000-0000-0000-0000-000000000004"), // operator -> Operator
        ];

        let mut insert = Query::insert()
            .into_table(Alias::new("user_to_role"))
            .columns([Alias::new("user_id"), Alias::new("role_id")])
            .to_owned();

        for (user_id, role_id) in user_roles {
            insert.values_panic([user_id.into(), role_id.into()]);
        }

        db.execute(db.get_database_backend().build(&insert))
            .await?;

        //=======Add units=======
        let units = [
            ("00000000-0000-0000-0002-000000000001", "Килограм", "кг"),
            ("00000000-0000-0000-0002-000000000002", "Литр", "л"),
            ("00000000-0000-0000-0002-000000000003", "Сум", "с"),
            ("00000000-0000-0000-0002-000000000004", "Штук", "шт"),
        ];

        let mut insert = Query::insert()
            .into_table(Units::Table)
            .columns([Units::Id, Units::Name, Units::ShortName, Units::DeviceId])
            .to_owned();

        for (id, name, short_name) in units {
            insert.values_panic([
                id.into(),
                name.into(),
                short_name.into(),
                "device-default-001".into(),
            ]);
        }

        db.execute(db.get_database_backend().build(&insert))
            .await?;

        //=======Add test camera=======
        let insert = Query::insert()
            .into_table(Cameras::Table)
            .columns([
                Cameras::Id,
                Cameras::CameraType,
                Cameras::Name,
                Cameras::Address,
                Cameras::DeviceId,
            ])
            .values_panic([
                "00000000-0000-0000-0004-000000000001".into(),
                "Local".into(),
                "Camera #1".into(),
                "127.0.0.1".into(),
                "device-default-001".into(),
            ])
            .to_owned();
        db.execute(db.get_database_backend().build(&insert))
            .await?;

        //=======Add test marks=======
        let marks = [
            ("00000000-0000-0000-0005-000000000001", "Топливо"),
            ("00000000-0000-0000-0005-000000000002", "Табачные изделия"),
            ("00000000-0000-0000-0005-000000000003", "Обувь"),
            ("00000000-0000-0000-0005-000000000004", "Одежда"),
            ("00000000-0000-0000-0005-000000000005", "Медикаменты"),
        ];

        let mut insert = Query::insert()
            .into_table(Marks::Table)
            .columns([Marks::Id, Marks::Name, Marks::DeviceId])
            .to_owned();

        for (id, name) in marks {
            insert.values_panic([
                id.into(),
                name.into(),
                "device-default-001".into(),
            ]);
        }

        db.execute(db.get_database_backend().build(&insert))
            .await?;

        //=======Add test groups=======
        let insert = Query::insert()
            .into_table(Groups::Table)
            .columns([
                Groups::Id,
                Groups::GroupType,
                Groups::Name,
                Groups::DeviceId,
            ])
            .values_panic([
                "00000000-0000-0000-0006-000000000001".into(),
                "No".into(),
                "Магазин".into(),
                "device-default-001".into(),
            ])
            .to_owned();
        db.execute(db.get_database_backend().build(&insert))
            .await?;

        let insert = Query::insert()
            .into_table(Groups::Table)
            .columns([
                Groups::Id,
                Groups::GroupType,
                Groups::MarkId,
                Groups::Name,
                Groups::ParentId,
                Groups::DeviceId,
            ])
            .values_panic([
                "00000000-0000-0000-0006-000000000002".into(),
                "Product".into(),
                "00000000-0000-0000-0005-000000000001".into(),
                "Жидкое топливо".into(),
                "00000000-0000-0000-0006-000000000001".into(),
                "device-default-001".into(),
            ])
            .to_owned();
        db.execute(db.get_database_backend().build(&insert))
            .await?;

        //=======Add products=======
        let products = [
            (
                "00000000-0000-0000-0008-000000000001",
                "Бензин АИ92",
                "АИ92",
                "1",
            ),
            (
                "00000000-0000-0000-0008-000000000002",
                "Бензин АИ95",
                "АИ95",
                "2",
            ),
            (
                "00000000-0000-0000-0008-000000000003",
                "Бензин АИ98",
                "АИ98",
                "3",
            ),
            (
                "00000000-0000-0000-0008-000000000004",
                "Бензин АИ100",
                "АИ100",
                "4",
            ),
        ];

        let mut insert = Query::insert()
            .into_table(Products::Table)
            .columns([
                Products::Id,
                Products::Name,
                Products::ShortName,
                Products::ProductType,
                Products::UnitId,
                Products::BarCode,
                Products::Article,
                Products::Balance,
                Products::GroupId,
                Products::DeviceId,
            ])
            .to_owned();

        for (id, name, short_name, barcode) in products {
            insert.values_panic([
                id.into(),
                name.into(),
                short_name.into(),
                "FuelLiquid".into(),
                "00000000-0000-0000-0002-000000000002".into(), // unit_id (Литр)
                barcode.into(),
                barcode.into(), // article = barcode
                0.0.into(),     // balance
                "00000000-0000-0000-0006-000000000002".into(), // group_id
                "device-default-001".into(),
            ]);
        }

        db.execute(db.get_database_backend().build(&insert))
            .await?;

        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        Ok(())
    }
}
