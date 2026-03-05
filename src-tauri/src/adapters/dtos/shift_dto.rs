use serde::Deserialize;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::domain::entities::shift_entity::ShiftData;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Deserialize)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct ShiftDTO {
    pub data: Vec<ShiftData>,
}
