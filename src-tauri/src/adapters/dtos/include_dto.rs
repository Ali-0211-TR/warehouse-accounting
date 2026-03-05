use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Deserialize, Serialize)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct IdWithIncludeDTO {
    pub id: String,
    pub include_nested: bool,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Deserialize, Serialize)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct ClientIdWithIncludeDTO {
    pub client_id: String,
    pub include_limits: bool,
}
