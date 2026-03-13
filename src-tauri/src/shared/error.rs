use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

pub type Result<T> = core::result::Result<T, Error>;

// #[derive(Debug)]
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum Error {
    CtxFail,
    RecordNotFound,
    StoreFailToCreate(String),
    DBDataNotFound(String),
    DBConnection,
    Unknown,
    ClosedShiftErrror,
    Authentication,
    NotAuthorized,
    NotLoggedIn,
    NotAdministrator,
    DataAccess,
    OpenedShiftErrror,
    Database(String),
    General(String),
    Validation(String),
}

impl From<sea_orm::DbErr> for Error {
    fn from(val: sea_orm::DbErr) -> Self {
        Error::Database(val.to_string())
    }
}

impl std::fmt::Display for Error {
    fn fmt(&self, fmt: &mut std::fmt::Formatter) -> core::result::Result<(), std::fmt::Error> {
        match self {
            Error::CtxFail => write!(fmt, "ctx_fail"),
            Error::RecordNotFound => write!(fmt, "record_not_found"),
            Error::StoreFailToCreate(msg) => write!(fmt, "store_fail_to_create.{}", msg),
            Error::DBDataNotFound(msg) => write!(fmt, "db_data_not_found.{}", msg),
            Error::DBConnection => write!(fmt, "db_connection_error"),
            Error::Unknown => write!(fmt, "unknown_error"),
            Error::ClosedShiftErrror => write!(fmt, "closed_shift_errror"),
            Error::Authentication => write!(fmt, "authentication"),
            Error::NotAuthorized => write!(fmt, "not_authorized"),
            Error::NotLoggedIn => write!(fmt, "not_logged_in"),
            Error::NotAdministrator => write!(fmt, "not_administrator"),
            Error::DataAccess => write!(fmt, "data_access_error"),
            Error::OpenedShiftErrror => write!(fmt, "opened_shift_errror"),
            Error::Database(msg) => write!(fmt, "database_error.{}", msg),
            Error::General(msg) => write!(fmt, "general_error.{}", msg),
            Error::Validation(msg) => write!(fmt, "validation_error.{}", msg),
        }
        // write!(fmt, "{self:?}")
    }
}

impl std::error::Error for Error {}
// endregion: --- Error Boiler
