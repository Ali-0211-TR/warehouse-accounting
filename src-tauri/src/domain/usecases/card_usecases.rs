use crate::Result;
use crate::domain::entities::card_entity::CardEntity;
use crate::domain::repositories::CardRepository;
use crate::shared::ctx::Ctx;

pub async fn get_cards_usecase(ctx: &Ctx) -> Result<Vec<CardEntity>> {
    let data = CardRepository::get(ctx.get_db()).await?;
    Ok(data)
}

pub async fn get_card_by_id_usecase(
    ctx: &Ctx,
    id: String,
    include_limits: bool,
) -> Result<CardEntity> {
    let data = CardRepository::get_by_id(ctx.get_db(), id, include_limits).await?;
    Ok(data)
}

pub async fn get_cards_by_client_id_usecase(
    ctx: &Ctx,
    client_id: String,
    include_limits: bool,
) -> Result<Vec<CardEntity>> {
    let data = CardRepository::get_by_client_id(ctx.get_db(), client_id, include_limits).await?;
    Ok(data)
}

pub async fn save_card_usecase(ctx: &Ctx, card_entity: CardEntity) -> Result<CardEntity> {
    let data = CardRepository::save(ctx.get_db(), card_entity).await?;
    Ok(data)
}

pub async fn delete_card_usecase(ctx: &Ctx, card_id: String) -> Result<u64> {
    let data = CardRepository::delete(ctx.get_db(), card_id).await?;
    Ok(data)
}
