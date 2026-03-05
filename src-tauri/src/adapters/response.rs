// use crate::{Error, Result};
use crate::Result;
use serde::Serialize;

#[derive(Serialize)]
struct IpcError {
    message: String,
}

#[derive(Serialize)]
pub struct IpcSimpleResult<D>
where
    D: Serialize,
{
    pub data: D,
}

#[derive(Serialize)]
pub struct IpcResponse<D>
where
    D: Serialize,
{
    error: Option<IpcError>,
    result: Option<IpcSimpleResult<D>>,
}

impl<D> From<Result<D>> for IpcResponse<D>
where
    D: Serialize,
{
    fn from(res: Result<D>) -> Self {
        match res {
            Ok(data) => IpcResponse {
                error: None,
                result: Some(IpcSimpleResult { data }),
            },
            Err(err) => IpcResponse {
                error: Some(IpcError {
                    message: format!("{err}"),
                }),
                result: None,
            },
        }
    }
}

// Helper macro to handle Result<T> -> IpcResponse<T> conversion with ? operator
#[macro_export]
macro_rules! ipc_handler {
    ($body:expr) => {
        (|| -> $crate::Result<_> { $body })().into()
    };
}

// Helper macro for async handlers
#[macro_export]
macro_rules! ipc_handler_async {
    ($body:expr) => {
        (async || -> $crate::Result<_> { $body })().await.into()
    };
}

