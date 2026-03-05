use crate::Result;
use crate::adapters::dtos::{LazyTableStateDTO, PaginatorDTO};
use crate::domain::entities::shift_entity::{ShiftColumn, ShiftData, ShiftEntity, ShiftFilter};
use crate::domain::entities::user_entity::UserEntity;
use crate::domain::repositories::{ShiftRepository, UserRepository};
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use chrono::Utc;
use entity::shifts as shft;
use sea_orm::{
    ActiveModelTrait, ActiveValue, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
};
use sea_orm::{ColumnTrait, TryIntoModel};
use std::sync::Arc;

pub async fn into_entity(db: Arc<DataStore>, model: shft::Model) -> Result<ShiftEntity> {
    let user_open = UserRepository::get_by_id_including_deleted(db.clone(), model.user_open_id).await?;
    let user_close = if let Some(id) = model.user_close_id {
        Some(UserRepository::get_by_id_including_deleted(db.clone(), id).await?)
    } else {
        None
    };

    let data_open: Vec<ShiftData> = serde_json::from_str(&model.data_open).unwrap_or_default();
    let data_close: Option<Vec<ShiftData>> =
        model.data_close.and_then(|d| serde_json::from_str(&d).ok());

    let res = ShiftEntity {
        id: Some(model.id),
        device_id: model.device_id,
        d_open: model.d_open,
        d_close: model.d_close,
        user_open,
        user_close,
        data_open,
        data_close,
        created_at: model.created_at,
        updated_at: model.updated_at,
        deleted_at: model.deleted_at,
        version: model.version,
    };

    Ok(res)
}

impl From<ShiftColumn> for shft::Column {
    fn from(order_column: ShiftColumn) -> Self {
        match order_column {
            ShiftColumn::Id => shft::Column::Id,
            ShiftColumn::DOpen => shft::Column::DOpen,
            ShiftColumn::DClose => shft::Column::DClose,
            ShiftColumn::UserOpenId => shft::Column::UserOpenId,
            ShiftColumn::UserCloseId => shft::Column::UserCloseId,
        }
    }
}

impl From<ShiftEntity> for shft::ActiveModel {
    fn from(entity: ShiftEntity) -> Self {
        let data_open = serde_json::to_string(&entity.data_open).unwrap_or("".to_string());
        let data_close = serde_json::to_string(&entity.data_close).ok();

        shft::ActiveModel {
            id: ActiveValue::Set(
                entity
                    .id
                    .unwrap_or_else(|| uuid::Uuid::new_v4().to_string()),
            ),
            device_id: ActiveValue::Set(entity.device_id),
            d_open: ActiveValue::Set(entity.d_open),
            data_open: ActiveValue::Set(data_open),
            d_close: ActiveValue::Set(entity.d_close),
            data_close: ActiveValue::Set(data_close),
            user_open_id: ActiveValue::Set(entity.user_open.id.unwrap()),
            user_close_id: ActiveValue::Set(entity.user_close.and_then(|u| u.id)),
            created_at: ActiveValue::Set(entity.created_at),
            updated_at: ActiveValue::Set(entity.updated_at),
            deleted_at: ActiveValue::Set(entity.deleted_at),
            version: ActiveValue::Set(entity.version),
        }
    }
}

impl ShiftRepository {
    pub async fn get(
        db: Arc<DataStore>,
        filter: LazyTableStateDTO<ShiftFilter, ShiftColumn>,
    ) -> Result<PaginatorDTO<ShiftEntity>> {
        Self::get_filtered_sorted(db, filter).await
    }

    async fn get_filtered_sorted(
        db: Arc<DataStore>,
        filter: LazyTableStateDTO<ShiftFilter, ShiftColumn>,
    ) -> Result<PaginatorDTO<ShiftEntity>> {
        let db_conn = db.get_db()?;
        let mut query = shft::Entity::find();

        if let Some(id) = filter.filters.id {
            query = query.filter(shft::Column::Id.eq(id));
        }

        if let Some((start, end)) = filter.filters.d_open {
            query = query.filter(shft::Column::DOpen.between(start, end));
        }
        if let Some((start, end)) = filter.filters.d_close {
            query = query.filter(shft::Column::DClose.between(start, end));
        }

        if let Some(user_open_id) = filter.filters.user_open_id {
            query = query.filter(shft::Column::UserOpenId.eq(user_open_id));
        }
        if let Some(user_close_id) = filter.filters.user_close_id {
            query = query.filter(shft::Column::UserCloseId.eq(user_close_id));
        }

        let sort_field: shft::Column = filter.sort_field.into();
        query = query.order_by(sort_field, filter.sort_order.into());
        println!("Query: {:?}", sort_field);

        let paginator = query.paginate(db_conn, filter.rows.try_into().unwrap());

        let page = filter.page.max(1) as u64;
        let shifts = paginator.fetch_page(page - 1).await?;

        let mut result: Vec<ShiftEntity> = Vec::new();
        for m in shifts {
            result.push(into_entity(db.clone(), m).await?);
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

    // pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<ShiftEntity> {
    //     let db_conn = db.get_db()?;
    //     let data = shft::Entity::find_by_id(id).one(db_conn).await?;
    //     let model = data.ok_or(Self::shift_not_found_error())?;
    //     let res = into_entity(db, model).await?;
    //     Ok(res)
    // }

    pub async fn get_active_shift(db: Arc<DataStore>) -> Result<Option<ShiftEntity>> {
        let db_raw = db.get_db()?;
        let data = shft::Entity::find()
            .filter(shft::Column::DClose.is_null())
            .one(db_raw)
            .await?;

        // println!("Active shift: {:?}", data);
        if let Some(data) = data {
            Ok(Some(into_entity(db, data).await?))
        } else {
            Ok(None)
        }
    }

    pub async fn open_shift(
        db: Arc<DataStore>,
        user_open: UserEntity,
        data_open: Vec<ShiftData>,
    ) -> Result<ShiftEntity> {
        let db_conn = db.get_db()?;

        println!("Creating shift with user_open_id: {:?}", user_open.id);
        println!("User device_id: {:?}", user_open.device_id);

        let new_shift = ShiftEntity {
            id: Some(uuid::Uuid::new_v4().to_string()), // Generate UUID directly
            d_open: Utc::now(),
            device_id: user_open.device_id.clone(), // Use user's device_id instead of default
            user_open: user_open.clone(),
            data_open,
            ..Default::default()
        };

        let model = shft::ActiveModel::from(new_shift);
        println!("ActiveModel user_open_id: {:?}", model.user_open_id);
        println!("ActiveModel device_id: {:?}", model.device_id);

        let data = model.insert(db_conn).await?; // Use insert instead of save
        let entity = into_entity(db, data).await?;
        Ok(entity)
    }

    pub async fn close_shift(
        db: Arc<DataStore>,
        user_close: UserEntity,
        data_close: Vec<ShiftData>,
    ) -> Result<ShiftEntity> {
        let active_shift = Self::get_active_shift(db.clone())
            .await?
            .ok_or(Self::shift_not_found_error())?;

        let db_conn = db.get_db()?;
        let entity = ShiftEntity {
            id: active_shift.id,
            device_id: active_shift.device_id,
            d_open: active_shift.d_open,
            d_close: Some(Utc::now()),
            user_open: active_shift.user_open,
            user_close: Some(user_close),
            data_open: active_shift.data_open,
            data_close: Some(data_close),
            created_at: active_shift.created_at,
            updated_at: Utc::now().to_rfc3339(),
            deleted_at: active_shift.deleted_at,
            version: active_shift.version + 1,
        };

        let model = shft::ActiveModel::from(entity);
        let data = model.save(db_conn).await?.try_into_model()?;
        let entity = into_entity(db, data).await?;
        Ok(entity)
    }

    pub async fn delete(db: Arc<DataStore>, shift_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = shft::Entity::delete_many()
            .filter(shft::Column::Id.eq(shift_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    fn shift_not_found_error() -> Error {
        Error::DBDataNotFound("shift_not_found".to_string())
    }
}
