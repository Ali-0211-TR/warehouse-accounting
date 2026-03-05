use crate::Result;
use crate::adapters::dtos::ContractProductDTO;
use crate::domain::entities::contract_product_entity::ContractProductEntity;
use crate::domain::repositories::ContractProductRepository;
use crate::shared::ctx::Ctx;

pub async fn get_contract_products_usecase(ctx: &Ctx) -> Result<Vec<ContractProductEntity>> {
    let data = ContractProductRepository::get(ctx.get_db()).await?;
    Ok(data)
}

pub async fn save_contract_product_usecase(
    ctx: &Ctx,
    contract_product: ContractProductDTO,
) -> Result<ContractProductEntity> {
    let data = ContractProductRepository::save(ctx.get_db(), contract_product).await?;
    Ok(data)
}

pub async fn delete_contract_product_usecase(
    ctx: &Ctx,
    contract_product_id: String,
) -> Result<u64> {
    let data = ContractProductRepository::delete(ctx.get_db(), contract_product_id).await?;
    Ok(data)
}
