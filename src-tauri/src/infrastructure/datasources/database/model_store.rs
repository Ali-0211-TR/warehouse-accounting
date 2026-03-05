use sea_orm::DatabaseConnection;

use crate::Result;

pub struct DataStore {
    store: Option<DatabaseConnection>,
}

impl DataStore {
    pub fn new(db: DatabaseConnection) -> Self {
        DataStore { store: Some(db) }
    }
    pub fn _empty() -> Self {
        DataStore { store: None }
    }
    pub fn get_db(&self) -> Result<&DatabaseConnection> {
        self.store.as_ref().ok_or(crate::Error::DBConnection)
    }
}
