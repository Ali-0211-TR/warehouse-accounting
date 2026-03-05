use crate::Result;
use crate::domain::repositories::{CardRepository, LimitRepository};
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use crate::{domain::entities::card_entity::CardEntity, shared::types::CardState};
use entity::cards::{ActiveModel, Column, Entity, Model};
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, TryIntoModel};
use std::str::FromStr;
use std::sync::Arc;

// Optimized: Implement From traits outside the impl block for better organization
impl From<Model> for CardEntity {
    fn from(model: Model) -> Self {
        CardEntity {
            id: Some(model.id),
            device_id: model.device_id,
            client: None,
            limits: None,
            name: model.name,
            d_begin: model.d_begin,
            d_end: model.d_end,
            state: CardState::from_str(&model.state).unwrap_or_default(),
            comment: model.comment,
            created_at: model.created_at,
            updated_at: model.updated_at,
            deleted_at: model.deleted_at,
            version: model.version,
        }
    }
}

impl From<CardEntity> for ActiveModel {
    fn from(entity: CardEntity) -> Self {
        ActiveModel {
            id: entity.id.map_or(ActiveValue::NotSet, ActiveValue::Set),
            device_id: ActiveValue::Set(entity.device_id),
            client_id: ActiveValue::Set(entity.client.and_then(|c| c.id)),
            name: ActiveValue::Set(entity.name),
            d_begin: ActiveValue::Set(entity.d_begin),
            d_end: ActiveValue::Set(entity.d_end),
            state: ActiveValue::Set(entity.state.to_string()),
            comment: ActiveValue::Set(entity.comment),
            created_at: ActiveValue::Set(entity.created_at),
            updated_at: ActiveValue::Set(entity.updated_at),
            deleted_at: ActiveValue::Set(entity.deleted_at),
            version: ActiveValue::Set(entity.version),
        }
    }
}

impl CardRepository {
    /// Get all cards from the database
    ///
    /// # Optimization notes:
    /// - Uses iterator map for efficient conversion
    /// - Consider adding pagination if card count grows large
    pub async fn get(db: Arc<DataStore>) -> Result<Vec<CardEntity>> {
        let db = db.get_db()?;
        let cards_list = Entity::find().all(db).await?;
        let cards_entities = cards_list.into_iter().map(CardEntity::from).collect();
        Ok(cards_entities)
    }

    /// Get a single card by ID
    ///
    /// # Arguments
    /// * `db` - Database connection
    /// * `id` - Card ID
    /// * `include_limits` - Whether to load associated limits
    pub async fn get_by_id(
        db: Arc<DataStore>,
        id: String,
        include_limits: bool,
    ) -> Result<CardEntity> {
        let db_conn = db.get_db()?;
        let card = Entity::find()
            .filter(Column::Id.eq(id.clone()))
            .one(db_conn)
            .await?
            .ok_or(Self::card_not_found_error())?;

        let mut card_entity: CardEntity = card.into();

        // Load limits if requested
        if include_limits {
            let limits = LimitRepository::get_by_card_id(db.clone(), id).await?;
            card_entity.limits = Some(limits);
        }

        Ok(card_entity)
    }

    /// Get all cards for a specific client
    ///
    /// # Arguments
    /// * `db` - Database connection
    /// * `client_id` - The client ID to fetch cards for
    /// * `include_limits` - Whether to load associated limits for each card
    pub async fn get_by_client_id(
        db: Arc<DataStore>,
        client_id: String,
        include_limits: bool,
    ) -> Result<Vec<CardEntity>> {
        let db_conn = db.get_db()?;
        let cards = Entity::find()
            .filter(Column::ClientId.eq(client_id))
            .all(db_conn)
            .await?;

        let mut card_entities: Vec<CardEntity> = cards.into_iter().map(CardEntity::from).collect();

        // Load limits for each card if requested
        if include_limits {
            for card in &mut card_entities {
                if let Some(card_id) = &card.id {
                    let limits =
                        LimitRepository::get_by_card_id(db.clone(), card_id.clone()).await?;
                    card.limits = Some(limits);
                }
            }
        }

        Ok(card_entities)
    }

    /// Save (insert or update) a card entity
    ///
    /// # Optimization notes:
    /// - Uses ActiveModel::save which handles both insert and update
    /// - Properly converts back to CardEntity with all fields
    pub async fn save(db: Arc<DataStore>, data: CardEntity) -> Result<CardEntity> {
        let db = db.get_db()?;
        let active_model: ActiveModel = data.into();
        let saved_model = active_model.save(db).await?;
        let card_model = saved_model.try_into_model()?;
        Ok(card_model.into())
    }

    /// Delete a card by ID
    ///
    /// # Returns
    /// Number of rows affected (should be 1 if successful, 0 if not found)
    pub async fn delete(db: Arc<DataStore>, card_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let delete_result = Entity::delete_many()
            .filter(Column::Id.eq(card_id))
            .exec(db)
            .await?;
        Ok(delete_result.rows_affected)
    }

    fn card_not_found_error() -> Error {
        Error::DBDataNotFound("card_not_found".to_string())
    }
}
