pub use sea_orm_migration::prelude::*;

mod m20220101_000001_create_table_cameras;
mod m20220101_000002_create_table_cards;
mod m20220101_000003_create_table_limits;
mod m20220101_000004_create_table_clients;
mod m20220101_000006_create_table_contracts;
mod m20220101_000010_create_table_dispenser_ports;
mod m20220101_000011_create_table_dispensers;
mod m20220101_000013_create_table_marks;
mod m20220101_000014_create_table_nozzles;
mod m20220101_000016_create_table_orders;
mod m20220101_000019_create_table_products;
mod m20220101_000021_create_table_shifts;
mod m20220101_000024_create_table_tanks;
mod m20220101_000025_create_table_units;
mod m20220101_000027_create_table_users;
mod m20250209_000001_create_table_taxes;
mod m20250210_000001_create_device_config;
mod m20250908_000001_add_performance_indexes;
mod m20251021_000001_add_company_phone;
mod m20251024_000001_fix_discount_to_product_fk;
mod m20251024_000002_add_logo_path;
mod m20260115_000001_add_label_template;
mod m20250125_091920_seed;
mod m20260121_093646_add_proguct_image;
mod m20260130_000001_add_missing_performance_indexes;


pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_create_table_cameras::Migration),
            Box::new(m20220101_000002_create_table_cards::Migration),
            Box::new(m20220101_000003_create_table_limits::Migration),
            Box::new(m20220101_000004_create_table_clients::Migration),
            Box::new(m20220101_000006_create_table_contracts::Migration),
            Box::new(m20220101_000010_create_table_dispenser_ports::Migration),
            Box::new(m20220101_000011_create_table_dispensers::Migration),
            Box::new(m20220101_000013_create_table_marks::Migration),
            Box::new(m20220101_000014_create_table_nozzles::Migration),
            Box::new(m20220101_000016_create_table_orders::Migration),
            Box::new(m20220101_000019_create_table_products::Migration),
            Box::new(m20220101_000021_create_table_shifts::Migration),
            Box::new(m20220101_000024_create_table_tanks::Migration),
            Box::new(m20220101_000025_create_table_units::Migration),
            Box::new(m20220101_000027_create_table_users::Migration),
            Box::new(m20250209_000001_create_table_taxes::Migration),
            Box::new(m20250210_000001_create_device_config::Migration),
            Box::new(m20250908_000001_add_performance_indexes::Migration),
            Box::new(m20251021_000001_add_company_phone::Migration),
            Box::new(m20251024_000001_fix_discount_to_product_fk::Migration),
            Box::new(m20251024_000002_add_logo_path::Migration),
            Box::new(m20260115_000001_add_label_template::Migration),
            Box::new(m20250125_091920_seed::Migration),
            Box::new(m20260121_093646_add_proguct_image::Migration),
            Box::new(m20260130_000001_add_missing_performance_indexes::Migration),
        ]
    }
}
