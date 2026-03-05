use crate::Result;
use crate::adapters::dtos::{ContractDTO, LazyTableStateDTO, PaginatorDTO};
use crate::domain::entities::client_entity::ClientEntity;
use crate::domain::entities::contract_entity::{ContractColumn, ContractEntity, ContractFilter};
use crate::domain::repositories::{
    ClientRepository, ContractCarRepository, ContractProductRepository, ContractRepository,
};
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use entity::contracts::{self, Column};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder,
};
use std::collections::HashMap;
use std::sync::Arc;
use uuid::Uuid;

impl ContractRepository {
    /// Get contracts with pagination (only non-deleted)
    pub async fn get(
        db: Arc<DataStore>,
        filter: LazyTableStateDTO<ContractFilter, ContractColumn>,
    ) -> Result<PaginatorDTO<ContractEntity>> {
        Self::get_with_preloaded_data(db, filter).await
    }

    /// Get all contracts including deleted ones (for admin/sync)
    pub async fn get_all(db: Arc<DataStore>) -> Result<Vec<ContractEntity>> {
        let db_conn = db.get_db()?;
        let contracts_list = contracts::Entity::find().all(db_conn).await?;
        let mut result = Vec::new();
        for model in contracts_list {
            result.push(into_entity(db.clone(), model).await?);
        }
        println!("Found {} contracts (including deleted)", result.len());
        Ok(result)
    }

    /// Get contract by ID (only if not deleted)
    pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<ContractEntity> {
        let db_conn = db.get_db()?;
        let data = contracts::Entity::find_by_id(id)
            .filter(contracts::Column::DeletedAt.is_null())
            .one(db_conn)
            .await?;
        let data = data.ok_or(Self::contract_not_found_error())?;
        let data = into_entity(db.clone(), data).await?;
        Ok(data)
    }

    pub async fn save(db: Arc<DataStore>, data: ContractDTO) -> Result<ContractEntity> {
        let db_conn = db.get_db()?;
        let is_new = data.id.is_none();
        let active_model: contracts::ActiveModel = data.into();

        let res = if is_new {
            active_model.insert(db_conn).await?
        } else {
            active_model.update(db_conn).await?
        };

        let res = into_entity(db.clone(), res).await?;
        Ok(res)
    }

    /// Soft delete - marks contract as deleted (for normal operations)
    pub async fn delete(db: Arc<DataStore>, contract_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let now = chrono::Utc::now().to_rfc3339();

        let existing = contracts::Entity::find()
            .filter(Column::Id.eq(&contract_id))
            .filter(Column::DeletedAt.is_null())
            .one(db_conn)
            .await?
            .ok_or(Self::contract_not_found_error())?;

        let active_model = contracts::ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            client_id: ActiveValue::Unchanged(existing.client_id),
            name: ActiveValue::Unchanged(existing.name),
            contract_name: ActiveValue::Unchanged(existing.contract_name),
            d_begin: ActiveValue::Unchanged(existing.d_begin),
            d_end: ActiveValue::Unchanged(existing.d_end),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now.clone()),
            deleted_at: ActiveValue::Set(Some(now)),
            version: ActiveValue::Set(existing.version + 1),
        };

        active_model.update(db_conn).await?;
        Ok(1)
    }

    /// Permanent delete - completely removes contract from database (for sync/cleanup)
    pub async fn delete_permanent(db: Arc<DataStore>, contract_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = contracts::Entity::delete_many()
            .filter(Column::Id.eq(contract_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    /// Restore a soft-deleted contract
    pub async fn restore(db: Arc<DataStore>, contract_id: String) -> Result<ContractEntity> {
        let db_conn = db.get_db()?;
        let now = chrono::Utc::now().to_rfc3339();

        let existing = contracts::Entity::find()
            .filter(Column::Id.eq(&contract_id))
            .one(db_conn)
            .await?
            .ok_or(Self::contract_not_found_error())?;

        let active_model = contracts::ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            client_id: ActiveValue::Unchanged(existing.client_id),
            name: ActiveValue::Unchanged(existing.name),
            contract_name: ActiveValue::Unchanged(existing.contract_name),
            d_begin: ActiveValue::Unchanged(existing.d_begin),
            d_end: ActiveValue::Unchanged(existing.d_end),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(existing.version + 1),
        };

        let res = active_model.update(db_conn).await?;
        into_entity(db, res).await
    }

    // New method to batch load contracts with related entities
    pub async fn get_with_preloaded_data(
        db: Arc<DataStore>,
        filter: LazyTableStateDTO<ContractFilter, ContractColumn>,
    ) -> Result<PaginatorDTO<ContractEntity>> {
        let db_conn = db.get_db()?;
        let mut query = contracts::Entity::find();

        // Filter out deleted contracts
        query = query.filter(contracts::Column::DeletedAt.is_null());

        // Apply filters
        if let Some(id) = filter.filters.id {
            query = query.filter(contracts::Column::Id.eq(id));
        }

        if let Some((start, end)) = filter.filters.d_begin {
            query = query.filter(contracts::Column::DBegin.between(start, end));
        }
        if let Some((start, end)) = filter.filters.d_end {
            query = query.filter(contracts::Column::DEnd.between(start, end));
        }

        let sort_field: contracts::Column = filter.sort_field.into();
        query = query.order_by(sort_field, filter.sort_order.into());
        println!("Query: {:?}", sort_field);

        // Fetch contracts
        let paginator = query.paginate(db_conn, filter.rows.try_into().unwrap());

        let page = filter.page.max(1) as u64;
        let contract_models = paginator.fetch_page(page - 1).await?;

        // Extract contract IDs for batch loading
        let contract_ids: Vec<String> = contract_models.iter().map(|c| c.id.clone()).collect();
        let client_ids: Vec<String> = contract_models
            .iter()
            .map(|c| c.client_id.clone())
            .collect();

        // Batch load related entities
        let products_map = Self::batch_load_contract_products(db.clone(), &contract_ids).await?;
        let cars_map = Self::batch_load_contract_cars(db.clone(), &contract_ids).await?;
        let clients_map = Self::batch_load_clients(db.clone(), client_ids).await?;

        // Construct contract entities with preloaded data
        let mut result = Vec::new();
        for model in contract_models {
            let model_id = model.id.clone();
            let client_id = model.client_id.clone();
            result.push(into_entity_with_preloaded(
                model,
                clients_map.get(&client_id).cloned(),
                products_map.get(&model_id).cloned().unwrap_or_default(),
                cars_map.get(&model_id).cloned().unwrap_or_default(),
            )?);
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

    // Helper methods for batch loading
    async fn batch_load_contract_products(
        db: Arc<DataStore>,
        contract_ids: &[String],
    ) -> Result<
        std::collections::HashMap<
            String,
            Vec<crate::domain::entities::contract_product_entity::ContractProductEntity>,
        >,
    > {
        let products =
            ContractProductRepository::get_products_for_contracts(db, contract_ids).await?;
        Ok(products)
    }

    async fn batch_load_contract_cars(
        db: Arc<DataStore>,
        contract_ids: &[String],
    ) -> Result<
        std::collections::HashMap<
            String,
            Vec<crate::domain::entities::contract_car_entity::ContractCarEntity>,
        >,
    > {
        let cars = ContractCarRepository::get_cars_for_contracts(db, contract_ids).await?;
        Ok(cars)
    }

    async fn batch_load_clients(
        db: Arc<DataStore>,
        client_ids: Vec<String>,
    ) -> Result<HashMap<String, ClientEntity>> {
        let clients = ClientRepository::get_by_ids(db, client_ids).await?;
        Ok(clients)
    }

    fn contract_not_found_error() -> Error {
        Error::DBDataNotFound("contract_not_found".to_string())
    }
}

// New function that accepts preloaded data
pub fn into_entity_with_preloaded(
    model: contracts::Model,
    client: Option<crate::domain::entities::client_entity::ClientEntity>,
    contract_products: Vec<crate::domain::entities::contract_product_entity::ContractProductEntity>,
    contract_cars: Vec<crate::domain::entities::contract_car_entity::ContractCarEntity>,
) -> Result<ContractEntity> {
    let res = ContractEntity {
        id: Some(model.id),
        device_id: model.device_id,
        client,
        name: model.name,
        contract_name: model.contract_name,
        d_begin: model.d_begin,
        d_end: model.d_end,
        contract_products,
        contract_cars,
        created_at: model.created_at,
        updated_at: model.updated_at,
        deleted_at: model.deleted_at,
        version: model.version,
    };
    Ok(res)
}

// Modify existing into_entity to use the new function when possible
pub async fn into_entity(db: Arc<DataStore>, model: contracts::Model) -> Result<ContractEntity> {
    let client = ClientRepository::get_by_id(db.clone(), model.client_id.clone(), false)
        .await
        .ok();

    let contract_products =
        ContractProductRepository::get_contract_products(db.clone(), model.id.clone()).await?;

    let contract_cars =
        ContractCarRepository::get_contract_cars(db.clone(), model.id.clone()).await?;

    into_entity_with_preloaded(model, client, contract_products, contract_cars)
}

impl From<ContractDTO> for contracts::ActiveModel {
    fn from(data: ContractDTO) -> Self {
        let is_new = data.id.is_none();
        contracts::ActiveModel {
            id: if is_new {
                ActiveValue::Set(Uuid::new_v4().to_string())
            } else {
                ActiveValue::Unchanged(data.id.unwrap())
            },
            device_id: ActiveValue::Set(data.device_id),
            client_id: data.client_id.map_or(ActiveValue::NotSet, ActiveValue::Set),
            name: ActiveValue::Set(data.name),
            contract_name: ActiveValue::Set(data.contract_name),
            d_begin: ActiveValue::Set(data.d_begin),
            d_end: ActiveValue::Set(data.d_end),
            created_at: ActiveValue::Set(data.created_at),
            updated_at: ActiveValue::Set(data.updated_at),
            deleted_at: ActiveValue::Set(data.deleted_at),
            version: ActiveValue::Set(data.version),
        }
    }
}

impl From<ContractColumn> for entity::contracts::Column {
    fn from(column: ContractColumn) -> Self {
        match column {
            ContractColumn::Id => entity::contracts::Column::Id,
            ContractColumn::DeviceId => entity::contracts::Column::DeviceId,
            ContractColumn::ClientId => entity::contracts::Column::ClientId,
            ContractColumn::Name => entity::contracts::Column::Name,
            ContractColumn::ContractName => entity::contracts::Column::ContractName,
            ContractColumn::DBegin => entity::contracts::Column::DBegin,
            ContractColumn::DEnd => entity::contracts::Column::DEnd,
        }
    }
}
