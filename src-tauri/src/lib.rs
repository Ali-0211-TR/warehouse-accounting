use adapters::ipc::*;
use domain::{
    repositories::{OrderRepository, ShiftRepository},
};
use infrastructure::{
    database::model_store::DataStore,
};
// use log::{error, info, warn};
use migration::MigratorTrait;
use sea_orm::{ConnectOptions, Database};
use shared::{
    ctx::Ctx,
    error::{Error, Result},
};
// use utoipa::openapi::info; // Unused
use std::{
    sync::{Arc, Mutex},
    time::Duration,
};
use tauri::Manager;
use tauri::path::BaseDirectory;

use crate::{
    domain::entities::user_entity::UserEntity,
    infrastructure::repositories::order_repository::OrderFetching,
};

use tracing::{debug, error, info};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use tracing_appender::rolling;
use tracing_subscriber::EnvFilter;

mod adapters;
mod domain;
mod infrastructure;
mod shared;

static _TRACING_GUARDS: std::sync::OnceLock<(
    tracing_appender::non_blocking::WorkerGuard,
    tracing_appender::non_blocking::WorkerGuard,
)> = std::sync::OnceLock::new();

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    // Set up logging
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        // Desktop: write logs into user-specific app data directory to avoid requiring elevated privileges.
        // Prefer platform-appropriate data dir (e.g. %APPDATA% on Windows), fall back to current dir.
        let log_dir = match dirs::data_dir() {
            Some(mut p) => {
                p.push("sklad-uchot");
                p.push("logs");
                p
            }
            None => std::env::current_dir().unwrap().join("logs"),
        };

        if let Err(e) = std::fs::create_dir_all(&log_dir) {
            error!("Failed to create log directory: {}", e);
        }

        let file_appender = rolling::daily(&log_dir, "app.log");
        let (non_blocking_file, _guard) = tracing_appender::non_blocking(file_appender);
        let (non_blocking_stdout, _guard2) = tracing_appender::non_blocking(std::io::stdout());

        // Combine both writers: file and stdout
        use tracing_subscriber::fmt::writer::MakeWriterExt;

        tracing_subscriber::fmt()
            .with_writer(non_blocking_file.and(non_blocking_stdout))
            .with_env_filter(
                // EnvFilter::try_from_default_env()
                //     .unwrap_or_else(|_| EnvFilter::new("info"))
                EnvFilter::try_from_default_env()
                    .unwrap_or_else(|_| EnvFilter::new("info"))
                    .add_directive("error".parse().unwrap())
                    .add_directive("sklad-uchot=debug".parse().unwrap()),
            )
            .init();
        let _ = _TRACING_GUARDS.set((_guard, _guard2));
    }
    debug!("Logging initialized");
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        // Mobile: log to stdout/logcat
        tracing_subscriber::fmt()
            .with_env_filter(EnvFilter::from_default_env())
            .init();
    }

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init());

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder
            .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
                info!("Single instance detected: {}, {argv:?}, {cwd}", app.package_info().name);

                use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

                // Показываем уведомление пользователю
                app.dialog()
                    .message("Приложение уже запущено!\n\nНельзя открывать более одного экземпляра приложения одновременно.")
                    .title("sklad-uchot")
                    .kind(MessageDialogKind::Warning)
                    .blocking_show();

                // Фокусируем существующее окно
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_focus();
                    let _ = window.unminimize();
                }
            }));
    }

    builder
        .setup(|app| {


            // Get platform-appropriate app data directory
            info!("[SETUP] Resolving app data directory...");
            let app_data_dir = match app
                .path()
                .resolve("sklad_uchot.db", BaseDirectory::AppData)
            {
                Ok(path) => {
                    println!("[SETUP] App data directory resolved: {:?}", path);
                    path
                },
                Err(e) => {
                    eprintln!("[ERROR] Failed to resolve app data directory: {}", e);
                    std::process::exit(1);
                }
            };

            info!("App data directory: {:?}", app_data_dir);

            // Ensure the directory exists
            println!("[SETUP] Creating app data directory if needed...");
            if let Some(parent) = app_data_dir.parent() {
                match std::fs::create_dir_all(parent) {
                    Ok(_) => println!("[SETUP] App data directory ready"),
                    Err(e) => {
                        eprintln!("[ERROR] Failed to create app data directory: {}", e);
                        std::process::exit(1);
                    }
                }
            }

            let database_url = format!("sqlite:{}?mode=rwc", app_data_dir.display());
            println!("[SETUP] Database URL: {}", database_url);

            // Move your database setup here...
            let handle = app.handle().clone();
            println!("[SETUP] Starting database setup...");
            tauri::async_runtime::spawn(async move {
                setup_database_and_app(database_url, handle).await;
            });

            println!("[SETUP] Setup complete, returning Ok");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ipc_serial_port::get_ports,
            // app info
            ipc_app::get_name,
            ipc_app::get_version,
            ipc_app::set_title,
            // //----camera---- REMOVED
            //----limit----
            ipc_limit::save_limit,
            ipc_limit::get_limit_by_id,
            ipc_limit::delete_limit,
            //----client----
            ipc_client::save_client,
            ipc_client::get_clients,
            ipc_client::get_all_clients,
            ipc_client::delete_client,
            ipc_client::delete_client_permanent,
            ipc_client::restore_client,
            ipc_client::get_client_by_id,
            //----device_config----
            ipc_device_config::get_device_config,
            ipc_device_config::get_default_receipt_templates,
            ipc_device_config::get_default_label_template,
            ipc_device_config::update_device_config,
            ipc_device_config::register_device,
            ipc_device_config::update_last_sync,
            //----discount---
            ipc_discount::save_discount,
            ipc_discount::get_discounts,
            ipc_discount::get_all_discounts,
            ipc_discount::delete_discount,
            ipc_discount::delete_discount_permanent,
            ipc_discount::restore_discount,
            //----dispenser_port--- REMOVED
            //----dispenser--- REMOVED
            //----group---
            ipc_group::save_group,
            ipc_group::get_groups,
            ipc_group::get_all_groups,
            ipc_group::delete_group,
            ipc_group::delete_group_permanent,
            ipc_group::restore_group,
            //----tax---
            ipc_tax::save_tax,
            ipc_tax::get_taxes,
            ipc_tax::get_all_taxes,
            ipc_tax::delete_tax,
            ipc_tax::delete_tax_permanent,
            ipc_tax::restore_tax,
            //----mark----
            ipc_mark::save_mark,
            ipc_mark::get_marks,
            ipc_mark::get_all_marks,
            ipc_mark::delete_mark,
            ipc_mark::delete_mark_permanent,
            ipc_mark::restore_mark,
            //----order_item----
            ipc_order_item::get_order_items,
            //----order----
            ipc_order::get_active_orders,
            ipc_order::close_active_order,
            // ipc_order::save_order,
            ipc_order::add_item_to_order,
            ipc_order::get_orders,
            ipc_order::delete_order,
            ipc_order::add_income_order,
            ipc_order::add_sale_order,
            ipc_order::add_return_order,
            ipc_order::add_outcome_order,
            ipc_order::remove_order_item,
            ipc_order::get_movement_report,
            //----payment----
            ipc_payment::ipc_add_payment_to_order,
            ipc_payment::ipc_remove_payment_from_order,
            ipc_payment::ipc_delete_payment,
            //----print----
            ipc_print::print_receipt,
            ipc_print::print_thermal_receipt,
            ipc_print::print_receipt_by_order,
            ipc_print::get_printers,
            ipc_print::print_to_named_printer,
            ipc_print::print_product_label,
            ipc_print::print_to_xprinter,
            ipc_print::print_escpos_to_system_printer,
            ipc_print::print_pdf_receipt,
            ipc_print::test_image_print,
            ipc_print::test_usb_image_print,
            ipc_print::test_pattern_print,
            //----price----
            ipc_price::save_price,
            ipc_price::get_prices,
            ipc_price::delete_price,
            //----product----
            ipc_product::save_product,
            ipc_product::get_products,
            ipc_product::get_all_products,
            ipc_product::get_products_paginated,
            ipc_product::delete_product,
            ipc_product::delete_product_permanent,
            ipc_product::restore_product,
            ipc_product::calc_all_product_balance,
            ipc_product::get_product_by_id,
            ipc_product::get_product_movement_report,
            //----product_image----
            ipc_product_image::upload_product_image,
            ipc_product_image::delete_product_image,
            ipc_product_image::get_product_image,
            ipc_product_image::get_product_image_path,
            //----shift----
            // ipc_shift::save_shift,
            ipc_shift::get_shifts,
            ipc_shift::delete_shift,
            ipc_shift::get_current_shift,
            ipc_shift::open_shift,
            ipc_shift::close_shift,
            //----shop---- DELETED - using device_config instead
            // ipc_shop::save_shop,
            // ipc_shop::get_shops,
            // ipc_shop::delete_shop,
            //----station---- DELETED - using device_config instead
            // ipc_station::save_station,
            // ipc_station::get_stations,
            // ipc_station::delete_station,
            //----tank---- REMOVED
            //----unit----
            ipc_unit::save_unit,
            ipc_unit::get_units,
            ipc_unit::get_all_units,
            ipc_unit::delete_unit,
            ipc_unit::delete_unit_permanent,
            ipc_unit::restore_unit,
            //----photo----
            ipc_photo::save_photo,
            ipc_photo::get_photos,
            ipc_photo::delete_photo,
            //----user----
            ipc_user::login,
            ipc_user::list_user,
            ipc_user::get_all_users,
            ipc_user::is_login,
            ipc_user::create_user,
            ipc_user::update_user,
            ipc_user::change_user_password,
            ipc_user::delete_user,
            ipc_user::delete_user_permanent,
            ipc_user::restore_user,
            // ipc_user::save_roles,
            ipc_user::logout,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn setup_database_and_app(database_url: String, app_handle: tauri::AppHandle) {
    println!("[DATABASE] Connecting to database: {}", database_url);
    let mut opt = ConnectOptions::new(&database_url);
    opt.max_connections(5)
        .min_connections(1)
        .connect_timeout(Duration::from_secs(8))
        .acquire_timeout(Duration::from_secs(8))
        .idle_timeout(Duration::from_secs(300))
        .max_lifetime(Duration::from_secs(300))
        .sqlx_logging(false);

    println!("[DATABASE] Establishing database connection...");
    let db = match Database::connect(opt).await {
        Ok(db) => {
            println!("[DATABASE] Database connection established");
            db
        }
        Err(e) => {
            eprintln!("[ERROR] Failed to connect to database: {}", e);
            std::process::exit(1);
        }
    };

    // Apply database migrations with logging
    println!("[DATABASE] Starting database migration check...");
    info!("Starting database migration check...");
    match migration::Migrator::up(&db, None).await {
        Ok(()) => {
            println!("[DATABASE] Migrations completed successfully");
            info!("✅ Database migrations completed successfully");
            info!(" Database schema is up to date");
        }
        Err(e) => {
            eprintln!("[ERROR] Database migration failed: {}", e);
            error!("❌ Database migration failed: {}", e);
            error!("Application cannot start without proper database schema");
            std::process::exit(1);
        }
    }

    let data_store = Arc::new(DataStore::new(db));

    let active_orders = match OrderRepository::fetch_active_orders(data_store.clone()).await {
        Ok(orders) => orders,
        Err(e) => {
            error!("Can't get active orders: {}", e);
            Vec::new()
        }
    };

    let active_shift = match ShiftRepository::get_active_shift(data_store.clone()).await {
        Ok(shift) => shift,
        Err(e) => {
            error!("Can't get active shift: {}", e);
            None
        }
    };

    let user: Arc<Mutex<Option<UserEntity>>> = Arc::new(Mutex::new(None));
    let active_orders = Arc::new(Mutex::new(active_orders));
    let active_shift = Arc::new(Mutex::new(active_shift));

    // Store all states in the app
    app_handle.manage(data_store);
    app_handle.manage(user);
    app_handle.manage(active_orders);
    app_handle.manage(active_shift);

    // Create app context
    let ctx = Arc::new(Ctx::new(app_handle.clone()));
    app_handle.manage(ctx);
}
