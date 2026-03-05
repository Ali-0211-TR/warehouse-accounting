use crate::Result;
use crate::adapters::dtos::TaxDTO;
use crate::domain::entities::tax_entity::TaxEntity;
use crate::domain::repositories::TaxRepository;
use crate::shared::ctx::Ctx;

pub async fn get_taxes_usecase(ctx: &Ctx) -> Result<Vec<TaxEntity>> {
    let data = TaxRepository::get(ctx.get_db()).await?;
    Ok(data)
}

pub async fn get_all_taxes_usecase(ctx: &Ctx) -> Result<Vec<TaxEntity>> {
    let data = TaxRepository::get_all(ctx.get_db()).await?;
    Ok(data)
}

pub async fn save_tax_usecase(ctx: &Ctx, input_dto: TaxDTO) -> Result<TaxEntity> {
    let device_id = ctx.get_device_id().await?;
    let tax_entity = input_dto.into_entity(device_id);
    let data = TaxRepository::save(ctx.get_db(), tax_entity).await?;
    Ok(data)
}

pub async fn delete_tax_usecase(ctx: &Ctx, tax_id: String) -> Result<u64> {
    let data = TaxRepository::delete(ctx.get_db(), tax_id).await?;
    Ok(data)
}

pub async fn delete_tax_permanent_usecase(ctx: &Ctx, tax_id: String) -> Result<u64> {
    let data = TaxRepository::delete_permanent(ctx.get_db(), tax_id).await?;
    Ok(data)
}

pub async fn restore_tax_usecase(ctx: &Ctx, tax_id: String) -> Result<TaxEntity> {
    let data = TaxRepository::restore(ctx.get_db(), tax_id).await?;
    Ok(data)
}
