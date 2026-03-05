use crate::Result;
use crate::adapters::dtos::ContractProductDTO;
use crate::domain::entities::contract_product_entity::ContractProductOrderItem;
use crate::domain::repositories::ContractProductRepository;
use crate::domain::{
    entities::contract_product_entity::ContractProductEntity, repositories::ProductRepository,
};
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use cp::Column;
use entity::{contract_products as cp, order_items};
use sea_orm::ColumnTrait;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, QueryFilter};
use std::collections::HashMap;
use std::sync::Arc;

pub async fn into_entity(
    db: Arc<DataStore>,
    model: cp::Model,
    order_items: Vec<order_items::Model>,
) -> Result<ContractProductEntity> {
    let product = ProductRepository::get_by_id(db.clone(), model.product_id)
        .await
        .ok();
    let order_items = order_items
        .into_iter()
        .map(|item| ContractProductOrderItem {
            id: item.id,
            order_id: item.order_id,
            count: item.count,
            price: item.price,
            discount: item.discount,
            cost: item.cost,
            tax: item.tax,
        })
        .collect::<Vec<_>>();

    let res = ContractProductEntity {
        id: Some(model.id),
        contract_id: model.contract_id,
        product,
        order_items,
        article: model.article,
        count: model.count,
        discount: None,
    };
    Ok(res)
}

impl From<ContractProductDTO> for cp::ActiveModel {
    fn from(entity: ContractProductDTO) -> Self {
        cp::ActiveModel {
            id: entity.id.map_or(ActiveValue::NotSet, ActiveValue::Set),
            device_id: ActiveValue::Set(entity.device_id),
            contract_id: ActiveValue::Set(entity.contract_id),
            product_id: entity
                .product_id
                .map_or(ActiveValue::NotSet, ActiveValue::Set),
            article: ActiveValue::Set(entity.article),
            count: ActiveValue::Set(entity.count),
            discount_id: ActiveValue::Set(entity.discount_id),
            created_at: ActiveValue::Set(entity.created_at),
            updated_at: ActiveValue::Set(entity.updated_at),
            deleted_at: ActiveValue::Set(entity.deleted_at),
            version: ActiveValue::Set(entity.version),
        }
    }
}

impl ContractProductRepository {
    pub async fn get_contract_products(
        db: Arc<DataStore>,
        contract_id: String,
    ) -> Result<Vec<ContractProductEntity>> {
        let db_conn = db.get_db()?;
        let contractproducts_list = cp::Entity::find()
            .find_with_related(order_items::Entity)
            .filter(cp::Column::ContractId.eq(contract_id))
            .all(db_conn)
            .await?;
        let mut contractproducts_entities = Vec::<ContractProductEntity>::new();
        for g in contractproducts_list {
            let d = into_entity(db.clone(), g.0, g.1).await?;
            contractproducts_entities.push(d);
        }
        Ok(contractproducts_entities)
    }

    pub async fn get(db: Arc<DataStore>) -> Result<Vec<ContractProductEntity>> {
        let db_conn = db.get_db()?;
        let contractproducts_list = cp::Entity::find()
            .find_with_related(order_items::Entity)
            .all(db_conn)
            .await?;
        let mut contractproducts_entities = Vec::<ContractProductEntity>::new();
        for g in contractproducts_list {
            let d = into_entity(db.clone(), g.0, g.1).await?;
            contractproducts_entities.push(d);
        }
        Ok(contractproducts_entities)
    }

    pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<ContractProductEntity> {
        let db_conn = db.get_db()?;
        let mut data_vec = cp::Entity::find()
            .filter(Column::Id.eq(id))
            .find_with_related(order_items::Entity)
            .all(db_conn)
            .await?;
        let (model, order_items) = data_vec
            .pop()
            .ok_or(Self::contract_product_not_found_error())?;
        let data = into_entity(db.clone(), model, order_items).await?;
        Ok(data)
    }

    pub async fn save(
        db: Arc<DataStore>,
        data: ContractProductDTO,
    ) -> Result<ContractProductEntity> {
        let db_conn = db.get_db()?;
        let active_model: cp::ActiveModel = data.into();
        let saved = active_model.save(db_conn).await?;
        println!("Saved contract product: {:?}", saved);
        let id = saved.id.unwrap();
        Self::get_by_id(db, id).await
    }

    pub async fn delete(db: Arc<DataStore>, contractproduct_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = cp::Entity::delete_many()
            .filter(Column::Id.eq(contractproduct_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    // New method to get products for multiple contracts at once
    pub async fn get_products_for_contracts(
        db: Arc<DataStore>,
        contract_ids: &[String],
    ) -> Result<HashMap<String, Vec<ContractProductEntity>>> {
        let mut result = HashMap::new();

        if contract_ids.is_empty() {
            return Ok(result);
        }

        let db_conn = db.get_db()?;
        let contractproducts_list = cp::Entity::find()
            .find_with_related(order_items::Entity)
            .filter(cp::Column::ContractId.is_in(contract_ids.to_vec()))
            .all(db_conn)
            .await?;

        // Process each product concurrently
        let entities = futures::future::try_join_all(
            contractproducts_list
                .into_iter()
                .map(|(model, order_items)| into_entity(db.clone(), model, order_items)),
        )
        .await?;

        for entity in entities {
            result
                .entry(entity.contract_id.clone())
                .or_insert_with(Vec::new)
                .push(entity);
        }
        Ok(result)
    }

    fn contract_product_not_found_error() -> Error {
        Error::DBDataNotFound("contract_product_not_found".to_string())
    }
}
