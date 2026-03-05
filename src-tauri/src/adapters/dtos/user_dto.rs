use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::RoleType;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Serialize, Deserialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct CreateUserDTO {
    pub full_name: String,
    pub username: String,
    pub phone_number: String,
    pub password: String,
    pub roles: Vec<RoleType>,
}
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Serialize, Deserialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct UpdateUserDTO {
    pub id: String,
    pub full_name: String,
    pub phone_number: String,
    pub roles: Vec<RoleType>,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Deserialize)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct LoginDTO {
    pub username: String,
    pub password: String,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Deserialize)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct ChangePasswordDTO {
    pub id: String,
    pub password: String,
}
