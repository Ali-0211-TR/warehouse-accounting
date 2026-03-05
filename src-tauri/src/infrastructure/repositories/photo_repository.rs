use crate::domain::entities::photo_entity::PhotoEntity;
use crate::domain::repositories::PhotoRepository;
use crate::infrastructure::database::model_store::DataStore;
// use crate::shared::error::Error;
use crate::Result;
use chrono::Utc;
use entity::photos::{ActiveModel, Column, Entity, Model};
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, TryIntoModel};
use std::sync::Arc;

impl From<Model> for PhotoEntity {
    fn from(model: Model) -> Self {
        PhotoEntity {
            id: Some(model.id),
            d_created: model.d_created,
            camera_id: model.camera_id,
            order_id: model.order_id,
        }
    }
}

impl From<PhotoEntity> for ActiveModel {
    fn from(entity: PhotoEntity) -> Self {
        ActiveModel {
            id: entity.id.map_or(ActiveValue::NotSet, ActiveValue::Set),
            d_created: ActiveValue::Set(entity.d_created),
            camera_id: ActiveValue::Set(entity.camera_id),
            order_id: ActiveValue::Set(entity.order_id),
            created_at: ActiveValue::Set(Utc::now().to_rfc3339()),
            updated_at: ActiveValue::Set(Utc::now().to_rfc3339()),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(1),
        }
    }
}

impl PhotoRepository {
    pub async fn get(db: Arc<DataStore>) -> Result<Vec<PhotoEntity>> {
        let db = db.get_db()?;
        let photos_list = Entity::find().all(db).await?;
        let photos_entities = photos_list.into_iter().map(PhotoEntity::from).collect();
        Ok(photos_entities)
    }

    // pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<PhotoEntity> {
    //     let db = db.get_db()?;
    //     let data = Entity::find().filter(Column::Id.eq(id)).one(db).await?;
    //     let data = data.ok_or(Error::DBDataNotFound(None))?;
    //     Ok(data.into())
    // }

    pub async fn save(db: Arc<DataStore>, data: PhotoEntity) -> Result<PhotoEntity> {
        let db = db.get_db()?;
        let active_model: ActiveModel = data.into();
        let res: ActiveModel = active_model.save(db).await?;
        let res = res.try_into_model()?;
        Ok(res.into())
    }

    pub async fn delete(db: Arc<DataStore>, photo_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = Entity::delete_many()
            .filter(Column::Id.eq(photo_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }
}
