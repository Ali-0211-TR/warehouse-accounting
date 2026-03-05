use std::path::PathBuf;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager, Wry, command};
use uuid::Uuid;

use crate::{
    adapters::response::IpcResponse,
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

/// DTO for uploading product image (base64 encoded)
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct UploadProductImageDTO {
    /// Product ID to associate the image with
    pub product_id: String,
    /// Base64 encoded image data
    pub image_data: String,
    /// File extension (e.g., "jpg", "png", "webp")
    pub extension: String,
}

/// DTO for deleting product image
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct DeleteProductImageDTO {
    /// Product ID
    pub product_id: String,
    /// Image path to delete
    pub image_path: String,
}

/// Response for uploaded image
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct ProductImageResponse {
    /// Relative path to the saved image (for storing in DB)
    pub image_path: String,
    /// Full URL/path for frontend to display
    pub image_url: String,
}

/// DTO for getting product image
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct GetProductImageDTO {
    /// Relative path to the image
    pub image_path: String,
}

/// Get the product image_paths directory path
fn get_product_image_paths_dir(app: &AppHandle<Wry>) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .resolve("", BaseDirectory::AppData)
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;

    let image_paths_dir = app_data_dir.join("product_image_paths");

    // Create directory if it doesn't exist
    if !image_paths_dir.exists() {
        std::fs::create_dir_all(&image_paths_dir)
            .map_err(|e| format!("Failed to create image_paths directory: {}", e))?;
    }

    Ok(image_paths_dir)
}

/// Upload a product image
#[command]
pub async fn upload_product_image(
    app: AppHandle<Wry>,
    params: UploadProductImageDTO,
) -> IpcResponse<ProductImageResponse> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app.clone())?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;

        // Get image_paths directory
        let image_paths_dir = get_product_image_paths_dir(&app)
            .map_err(|e| crate::shared::error::Error::General(e))?;

        // Create product-specific subdirectory
        let product_dir = image_paths_dir.join(&params.product_id);
        if !product_dir.exists() {
            std::fs::create_dir_all(&product_dir).map_err(|e| {
                crate::shared::error::Error::General(format!(
                    "Failed to create product directory: {}",
                    e
                ))
            })?;
        }

        // Generate unique filename
        let filename = format!("{}.{}", Uuid::new_v4(), params.extension.to_lowercase());
        let file_path = product_dir.join(&filename);

        // Decode base64 image data
        use base64::{Engine as _, engine::general_purpose::STANDARD};
        let image_bytes = STANDARD.decode(&params.image_data).map_err(|e| {
            crate::shared::error::Error::General(format!("Failed to decode base64 image: {}", e))
        })?;

        // Write image to file
        std::fs::write(&file_path, &image_bytes).map_err(|e| {
            crate::shared::error::Error::General(format!("Failed to write image file: {}", e))
        })?;

        // Create relative path for storing in DB
        let relative_path = format!("product_image_paths/{}/{}", params.product_id, filename);

        // Create full path for frontend
        let image_url = file_path.to_string_lossy().to_string();

        Ok(ProductImageResponse {
            image_path: relative_path,
            image_url,
        })
    })
}

/// Delete a product image
#[command]
pub async fn delete_product_image(
    app: AppHandle<Wry>,
    params: DeleteProductImageDTO,
) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app.clone())?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;

        // Get image_paths directory
        let app_data_dir = app
            .path()
            .resolve("", BaseDirectory::AppData)
            .map_err(|e| {
                crate::shared::error::Error::General(format!(
                    "Failed to resolve app data directory: {}",
                    e
                ))
            })?;

        // Construct full path from relative path
        let full_path = app_data_dir.join(&params.image_path);

        // Delete the file if it exists
        if full_path.exists() {
            std::fs::remove_file(&full_path).map_err(|e| {
                crate::shared::error::Error::General(format!("Failed to delete image file: {}", e))
            })?;
        }

        Ok(true)
    })
}

/// Get product image as base64
#[command]
pub async fn get_product_image(
    app: AppHandle<Wry>,
    params: GetProductImageDTO,
) -> IpcResponse<String> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app.clone())?;
        ctx.is_logged_in()?;

        // Get app data directory
        let app_data_dir = app
            .path()
            .resolve("", BaseDirectory::AppData)
            .map_err(|e| {
                crate::shared::error::Error::General(format!(
                    "Failed to resolve app data directory: {}",
                    e
                ))
            })?;

        // Construct full path
        let full_path = app_data_dir.join(&params.image_path);

        // Read file
        let image_bytes = std::fs::read(&full_path).map_err(|e| {
            crate::shared::error::Error::General(format!("Failed to read image file: {}", e))
        })?;

        // Encode to base64
        use base64::{Engine as _, engine::general_purpose::STANDARD};
        let base64_data = STANDARD.encode(&image_bytes);

        // Determine mime type from extension
        let extension = full_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("jpg")
            .to_lowercase();

        let mime_type = match extension.as_str() {
            "png" => "image/png",
            "gif" => "image/gif",
            "webp" => "image/webp",
            "svg" => "image/svg+xml",
            _ => "image/jpeg",
        };

        // Return as data URL
        Ok(format!("data:{};base64,{}", mime_type, base64_data))
    })
}

/// Get full file path for a product image (for direct file access)
#[command]
pub async fn get_product_image_path(
    app: AppHandle<Wry>,
    params: GetProductImageDTO,
) -> IpcResponse<String> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app.clone())?;
        ctx.is_logged_in()?;

        // Get app data directory
        let app_data_dir = app
            .path()
            .resolve("", BaseDirectory::AppData)
            .map_err(|e| {
                crate::shared::error::Error::General(format!(
                    "Failed to resolve app data directory: {}",
                    e
                ))
            })?;

        // Construct full path
        let full_path = app_data_dir.join(&params.image_path);

        Ok(full_path.to_string_lossy().to_string())
    })
}
