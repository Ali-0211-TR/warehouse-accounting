use crate::Result;
use crate::adapters::dtos::{LazyTableStateDTO, PaginatorDTO};
use crate::domain::entities::client_entity::{ClientColumn, ClientFilter};
use crate::domain::repositories::ClientRepository;
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use crate::{domain::entities::client_entity::ClientEntity, shared::types::ClientType};
use entity::clients::{self, Column};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder,
};
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;
use uuid::Uuid;

impl ClientRepository {
    async fn get_filtered_sorted(
        db: Arc<DataStore>,
        filter: LazyTableStateDTO<ClientFilter, ClientColumn>,
    ) -> Result<PaginatorDTO<ClientEntity>> {
        let db_conn = db.get_db()?;
        let mut query = clients::Entity::find().filter(clients::Column::DeletedAt.is_null());

        if let Some(id) = filter.filters.id {
            query = query.filter(clients::Column::Id.eq(id));
        }

        if let Some(name) = filter.filters.name {
            query = query.filter(clients::Column::Name.contains(name));
        };

        if let Some(name_short) = filter.filters.name_short {
            query = query.filter(clients::Column::NameShort.contains(name_short));
        };

        if let Some(client_type) = filter.filters.client_type {
            query = query.filter(clients::Column::ClientType.eq(client_type.to_string()));
        };

        let sort_field: clients::Column = filter.sort_field.into();
        query = query.order_by(sort_field, filter.sort_order.into());
        println!("Query: {:?}", sort_field);

        let paginator = query.paginate(db_conn, filter.rows.try_into().unwrap());

        let page = filter.page.max(1) as u64;
        let orders = paginator.fetch_page(page - 1).await?;
        let mut result: Vec<ClientEntity> = Vec::new();
        for m in orders {
            result.push(m.into());
        }

        let num_items_and_pages = paginator.num_items_and_pages().await?;
        let res = PaginatorDTO {
            items: result,
            page: page as u32,
            count: num_items_and_pages.number_of_items as u32,
            limit: filter.rows as u32,
            page_count: num_items_and_pages.number_of_pages as u32,
        };
        Ok(res)
    }

    /// Get clients with pagination (only non-deleted)
    pub async fn get(
        db: Arc<DataStore>,
        filter: LazyTableStateDTO<ClientFilter, ClientColumn>,
    ) -> Result<PaginatorDTO<ClientEntity>> {
        Self::get_filtered_sorted(db, filter).await
    }

    /// Get all clients including deleted ones (for admin/sync)
    pub async fn get_all(db: Arc<DataStore>) -> Result<Vec<ClientEntity>> {
        let db_conn = db.get_db()?;
        let clients_list = clients::Entity::find().all(db_conn).await?;
        let clients_entities: Vec<ClientEntity> =
            clients_list.into_iter().map(ClientEntity::from).collect();
        println!(
            "Found {} clients (including deleted)",
            clients_entities.len()
        );
        Ok(clients_entities)
    }

    /// Get client by ID (only if not deleted)
    pub async fn get_by_id(
        db: Arc<DataStore>,
        id: String,
    ) -> Result<ClientEntity> {
        let db_conn = db.get_db()?;
        let data = clients::Entity::find_by_id(id.clone())
            .filter(clients::Column::DeletedAt.is_null())
            .one(db_conn)
            .await?;
        let data = data.ok_or(Self::client_not_found_error())?;

        let client_entity: ClientEntity = data.into();

        Ok(client_entity)
    }

    pub async fn get_by_ids(
        db: Arc<DataStore>,
        ids: Vec<String>,
    ) -> Result<HashMap<String, ClientEntity>> {
        let db = db.get_db()?;
        let data = clients::Entity::find()
            .filter(clients::Column::Id.is_in(ids))
            .all(db)
            .await?;
        let mut result = HashMap::new();
        for m in data {
            result.insert(m.id.clone(), m.into());
        }
        Ok(result)
    }

    // pub async fn get_by_station_id(
    //     db: Arc<DataStore>,
    //     station_id: String,
    // ) -> Result<Vec<ClientEntity>> {
    //     let db = db.get_db()?;
    //     let data = clients::Entity::find()
    //         .filter(clients::Column::StationId.eq(station_id))
    //         .all(db)
    //         .await?;
    //     Ok(data.into_iter().map(|m| m.into()).collect())
    // }

    pub async fn save(db: Arc<DataStore>, entity: ClientEntity) -> Result<ClientEntity> {
        let db_conn = db.get_db()?;
        let is_new = entity.id.is_none();
        let now = chrono::Utc::now().to_rfc3339();

        let active_model = clients::ActiveModel {
            id: if is_new {
                ActiveValue::Set(Uuid::new_v4().to_string())
            } else {
                ActiveValue::Unchanged(entity.id.unwrap())
            },
            device_id: ActiveValue::Set(entity.device_id),
            client_type: ActiveValue::Set(entity.client_type.to_string()),
            name: ActiveValue::Set(entity.name),
            name_short: ActiveValue::Set(entity.name_short),
            document_code: ActiveValue::Set(entity.document_code),
            address: ActiveValue::Set(entity.address),
            tax_code: ActiveValue::Set(entity.tax_code),
            bank: ActiveValue::Set(entity.bank),
            contact: ActiveValue::Set(entity.contact),
            login: ActiveValue::Set(entity.login),
            password: ActiveValue::Set(entity.password),
            // Metadata handled by repository
            created_at: if is_new {
                ActiveValue::Set(now.clone())
            } else {
                ActiveValue::Unchanged(entity.created_at)
            },
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: if is_new {
                ActiveValue::Set(1)
            } else {
                ActiveValue::Set(entity.version + 1)
            },
        };

        let res = if is_new {
            active_model.insert(db_conn).await?
        } else {
            active_model.update(db_conn).await?
        };

        Ok(res.into())
    }

    /// Soft delete - marks client as deleted (for normal operations)
    pub async fn delete(db: Arc<DataStore>, client_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let now = chrono::Utc::now().to_rfc3339();

        let existing = clients::Entity::find()
            .filter(Column::Id.eq(&client_id))
            .filter(Column::DeletedAt.is_null())
            .one(db_conn)
            .await?
            .ok_or(Self::client_not_found_error())?;

        let active_model = clients::ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            client_type: ActiveValue::Unchanged(existing.client_type),
            name: ActiveValue::Unchanged(existing.name),
            name_short: ActiveValue::Unchanged(existing.name_short),
            document_code: ActiveValue::Unchanged(existing.document_code),
            address: ActiveValue::Unchanged(existing.address),
            tax_code: ActiveValue::Unchanged(existing.tax_code),
            bank: ActiveValue::Unchanged(existing.bank),
            contact: ActiveValue::Unchanged(existing.contact),
            login: ActiveValue::Unchanged(existing.login),
            password: ActiveValue::Unchanged(existing.password),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now.clone()),
            deleted_at: ActiveValue::Set(Some(now)),
            version: ActiveValue::Set(existing.version + 1),
        };

        active_model.update(db_conn).await?;
        Ok(1)
    }

    /// Permanent delete - completely removes client from database (for sync/cleanup)
    pub async fn delete_permanent(db: Arc<DataStore>, client_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = clients::Entity::delete_many()
            .filter(Column::Id.eq(client_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    /// Restore a soft-deleted client
    pub async fn restore(db: Arc<DataStore>, client_id: String) -> Result<ClientEntity> {
        let db_conn = db.get_db()?;
        let now = chrono::Utc::now().to_rfc3339();

        let existing = clients::Entity::find()
            .filter(Column::Id.eq(&client_id))
            .one(db_conn)
            .await?
            .ok_or(Self::client_not_found_error())?;

        let active_model = clients::ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            client_type: ActiveValue::Unchanged(existing.client_type),
            name: ActiveValue::Unchanged(existing.name),
            name_short: ActiveValue::Unchanged(existing.name_short),
            document_code: ActiveValue::Unchanged(existing.document_code),
            address: ActiveValue::Unchanged(existing.address),
            tax_code: ActiveValue::Unchanged(existing.tax_code),
            bank: ActiveValue::Unchanged(existing.bank),
            contact: ActiveValue::Unchanged(existing.contact),
            login: ActiveValue::Unchanged(existing.login),
            password: ActiveValue::Unchanged(existing.password),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(existing.version + 1),
        };

        let res = active_model.update(db_conn).await?;
        Ok(res.into())
    }

    fn client_not_found_error() -> Error {
        Error::DBDataNotFound("client_not_found".to_string())
    }
}

impl From<clients::Model> for ClientEntity {
    fn from(model: clients::Model) -> Self {
        ClientEntity {
            id: Some(model.id),
            device_id: model.device_id,
            client_type: ClientType::from_str(&model.client_type).unwrap(),
            name: model.name,
            name_short: model.name_short,
            document_code: model.document_code,
            address: model.address,
            tax_code: model.tax_code,
            bank: model.bank,
            contact: model.contact,
            login: model.login,
            password: model.password,
            created_at: model.created_at,
            updated_at: model.updated_at,
            deleted_at: model.deleted_at,
            version: model.version,
        }
    }
}

impl From<ClientColumn> for entity::clients::Column {
    fn from(client_column: ClientColumn) -> Self {
        match client_column {
            ClientColumn::Id => entity::clients::Column::Id,
            ClientColumn::DeviceId => entity::clients::Column::DeviceId,
            ClientColumn::ClientType => entity::clients::Column::ClientType,
            ClientColumn::Name => entity::clients::Column::Name,
            ClientColumn::NameShort => entity::clients::Column::NameShort,
            ClientColumn::DocumentCode => entity::clients::Column::DocumentCode,
            ClientColumn::Address => entity::clients::Column::Address,
            ClientColumn::TaxCode => entity::clients::Column::TaxCode,
            ClientColumn::Bank => entity::clients::Column::Bank,
            ClientColumn::Contact => entity::clients::Column::Contact,
            ClientColumn::Login => entity::clients::Column::Login,
            ClientColumn::Password => entity::clients::Column::Password,
        }
    }
}
