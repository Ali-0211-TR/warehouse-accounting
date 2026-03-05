use crate::{
    Result,
    domain::{
        entities::{fueling_order_entity::FuelingOrderEntity, order_item_entity::OrderItemEntity},
        repositories::FuelingOrderRepository,
    },
    infrastructure::database::model_store::DataStore,
    shared::types::{FuelingType, PresetType},
};
use chrono::Utc;
use entity::fueling_order as foi;
use rust_decimal::Decimal;
use sea_orm::DatabaseTransaction;
use sea_orm::{ActiveModelTrait, ActiveValue, TryIntoModel};
use std::{str::FromStr, sync::Arc};
use uuid::Uuid;

pub fn into_entity(model: foi::Model) -> FuelingOrderEntity {
    FuelingOrderEntity {
        id: Some(model.id),
        order_item_id: model.order_item_id,
        title: model.title,
        d_created: model.d_created,
        d_move: model.d_move,
        nozzle_id: model.nozzle_id,
        volume: model.volume,
        amount: model.amount,
        preset_volume: model.preset_volume,
        preset_amount: model.preset_amount,
        preset_type: PresetType::from_str(&model.preset_type).unwrap_or_default(),
        fueling_type: FuelingType::from_str(&model.fueling_type).unwrap_or_default(),
    }
}

pub fn from_entity(entity: FuelingOrderEntity) -> foi::ActiveModel {
    foi::ActiveModel {
        id: entity.id.map_or(ActiveValue::NotSet, ActiveValue::Set),
        preset_volume: ActiveValue::Set(entity.preset_volume),
        preset_amount: ActiveValue::Set(entity.preset_amount),
        preset_type: ActiveValue::Set(entity.preset_type.to_string()),
        fueling_type: ActiveValue::Set(entity.fueling_type.to_string()),
        title: ActiveValue::Set(entity.title),
        d_created: ActiveValue::Set(entity.d_created),
        d_move: ActiveValue::Set(entity.d_move),
        order_item_id: ActiveValue::Set(entity.order_item_id),
        nozzle_id: ActiveValue::Set(entity.nozzle_id),
        volume: ActiveValue::Set(entity.volume),
        amount: ActiveValue::Set(entity.amount),
        created_at: ActiveValue::Set(Utc::now().to_rfc3339()),
        updated_at: ActiveValue::Set(Utc::now().to_rfc3339()),
        deleted_at: ActiveValue::Set(None),
        version: ActiveValue::Set(1),
    }
}

pub fn from_order_item(
    order_item: &OrderItemEntity,
    nozzle_id: String,
    preset_type: PresetType,
    preset: Decimal,
) -> foi::ActiveModel {
    let (preset_volume, preset_amount) = match preset_type {
        PresetType::Volume => (preset, Decimal::ZERO),
        PresetType::Amount => (Decimal::ZERO, preset),
    };

    foi::ActiveModel {
        id: ActiveValue::Set(Uuid::new_v4().to_string()),
        title: ActiveValue::Set(
            order_item
                .product
                .as_ref()
                .map_or("".to_owned(), |p| p.name.clone()),
        ),
        d_created: ActiveValue::Set(Utc::now()),
        d_move: ActiveValue::NotSet,
        volume: ActiveValue::Set(order_item.count),
        amount: ActiveValue::Set(order_item.cost),
        preset_volume: ActiveValue::Set(preset_volume),
        preset_amount: ActiveValue::Set(preset_amount),
        preset_type: ActiveValue::Set(preset_type.to_string()),
        fueling_type: ActiveValue::Set(FuelingType::Regular.to_string()),
        order_item_id: ActiveValue::Set(order_item.id.clone().unwrap()),
        nozzle_id: ActiveValue::Set(nozzle_id),
        created_at: ActiveValue::Set(Utc::now().to_rfc3339()),
        updated_at: ActiveValue::Set(Utc::now().to_rfc3339()),
        deleted_at: ActiveValue::NotSet,
        version: ActiveValue::Set(1),
    }
}

impl FuelingOrderRepository {
    pub async fn create_from_order_item(
        dbtr: &DatabaseTransaction,
        order_item: &OrderItemEntity,
        nozzle_id: String,
        preset_type: PresetType,
        preset: Decimal,
    ) -> Result<FuelingOrderEntity> {
        let active_model = from_order_item(order_item, nozzle_id, preset_type, preset);
        let saved_model = active_model.insert(dbtr).await?.try_into_model()?;
        Ok(into_entity(saved_model))
    }

    pub async fn stop_fueling(
        dbtr: &DatabaseTransaction,
        entity: FuelingOrderEntity,
    ) -> Result<FuelingOrderEntity> {
        let mut active_model = from_entity(entity.clone());
        active_model.d_move = ActiveValue::Set(Some(Utc::now()));
        let res = active_model.save(dbtr).await?.try_into_model()?;
        Ok(into_entity(res))
    }

    pub async fn save(
        db: Arc<DataStore>,
        entity: FuelingOrderEntity,
    ) -> Result<FuelingOrderEntity> {
        let db = db.get_db()?;
        let active_model = from_entity(entity);
        let saved_model = active_model.save(db).await?.try_into_model()?;
        Ok(into_entity(saved_model))
    }
}
