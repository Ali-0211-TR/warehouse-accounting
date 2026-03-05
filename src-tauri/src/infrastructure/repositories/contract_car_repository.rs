use crate::Result;
use crate::adapters::dtos::ContractCarDTO;
use crate::domain::{
    entities::contract_car_entity::ContractCarEntity, repositories::ContractCarRepository,
};
use crate::infrastructure::database::model_store::DataStore;
use entity::contract_cars::{self as cc, Column};
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter};
use std::{collections::HashMap, sync::Arc};
use uuid::Uuid;

impl From<cc::Model> for ContractCarEntity {
    fn from(model: cc::Model) -> Self {
        ContractCarEntity {
            id: Some(model.id),
            device_id: model.device_id,
            contract_id: model.contract_id,
            name: model.name,
            comment: model.comment,
            created_at: model.created_at,
            updated_at: model.updated_at,
            deleted_at: model.deleted_at,
            version: model.version,
        }
    }
}

impl From<ContractCarDTO> for cc::ActiveModel {
    fn from(data: ContractCarDTO) -> Self {
        let is_new = data.id.is_none();
        cc::ActiveModel {
            id: if is_new {
                ActiveValue::Set(Uuid::new_v4().to_string())
            } else {
                ActiveValue::Unchanged(data.id.unwrap())
            },
            device_id: ActiveValue::Set(data.device_id),
            contract_id: ActiveValue::Set(data.contract_id),
            name: ActiveValue::Set(data.name),
            comment: ActiveValue::Set(data.comment),
            created_at: ActiveValue::Set(data.created_at),
            updated_at: ActiveValue::Set(data.updated_at),
            deleted_at: ActiveValue::Set(data.deleted_at),
            version: ActiveValue::Set(data.version),
        }
    }
}

impl ContractCarRepository {
    pub async fn get_contract_cars(
        db: Arc<DataStore>,
        contract_id: String,
    ) -> Result<Vec<ContractCarEntity>> {
        let db_conn = db.get_db()?;
        let cars = cc::Entity::find()
            .filter(cc::Column::ContractId.eq(contract_id))
            .all(db_conn)
            .await?;
        Ok(cars.into_iter().map(Into::into).collect())
    }

    pub async fn get(db: Arc<DataStore>) -> Result<Vec<ContractCarEntity>> {
        let db = db.get_db()?;
        let contractcars_list = cc::Entity::find().all(db).await?;
        let contractcars_entities = contractcars_list
            .into_iter()
            .map(ContractCarEntity::from)
            .collect();
        Ok(contractcars_entities)
    }

    // pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<ContractCarEntity> {
    //     let db = db.get_db()?;
    //     let data = cc::Entity::find().filter(Column::Id.eq(id)).one(db).await?;
    //     let data = data.ok_or(Error::DBDataNotFound(None))?;
    //     Ok(data.into())
    // }

    pub async fn save(db: Arc<DataStore>, data: ContractCarDTO) -> Result<ContractCarEntity> {
        let db_conn = db.get_db()?;
        let is_new = data.id.is_none();
        let active_model: cc::ActiveModel = data.into();

        let res = if is_new {
            active_model.insert(db_conn).await?
        } else {
            active_model.update(db_conn).await?
        };

        Ok(res.into())
    }

    pub async fn delete(db: Arc<DataStore>, contractcar_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = cc::Entity::delete_many()
            .filter(Column::Id.eq(contractcar_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    pub async fn get_cars_for_contracts(
        db: Arc<DataStore>,
        contract_ids: &[String],
    ) -> Result<HashMap<String, Vec<ContractCarEntity>>> {
        let mut result: HashMap<String, Vec<ContractCarEntity>> = HashMap::new();

        if contract_ids.is_empty() {
            return Ok(result);
        }

        let db_conn = db.get_db()?;
        let contract_car_list = cc::Entity::find()
            .filter(cc::Column::ContractId.is_in(contract_ids.to_vec()))
            .all(db_conn)
            .await?;

        // Process each product concurrently
        let entities: Vec<ContractCarEntity> = contract_car_list
            .into_iter()
            .map(|model| model.into())
            .collect();

        for entity in entities {
            result
                .entry(entity.contract_id.clone())
                .or_default()
                .push(entity);
        }
        Ok(result)
    }
}
