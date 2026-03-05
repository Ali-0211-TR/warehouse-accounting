use crate::Result;
use crate::adapters::dtos::{ContractDTO, LazyTableStateDTO, PaginatorDTO};
use crate::domain::entities::contract_entity::{ContractColumn, ContractEntity, ContractFilter};
use crate::domain::repositories::ContractRepository;
use crate::shared::ctx::Ctx;

pub async fn get_contracts_usecase(
    ctx: &Ctx,
    filter: LazyTableStateDTO<ContractFilter, ContractColumn>,
) -> Result<PaginatorDTO<ContractEntity>> {
    let data = ContractRepository::get(ctx.get_db(), filter).await?;
    Ok(data)
}

pub async fn get_all_contracts_usecase(ctx: &Ctx) -> Result<Vec<ContractEntity>> {
    let data = ContractRepository::get_all(ctx.get_db()).await?;
    Ok(data)
}

pub async fn save_contract_usecase(ctx: &Ctx, data: ContractDTO) -> Result<ContractEntity> {
    let data = ContractRepository::save(ctx.get_db(), data).await?;
    Ok(data)
}

pub async fn delete_contract_usecase(ctx: &Ctx, contract_id: String) -> Result<u64> {
    let data = ContractRepository::delete(ctx.get_db(), contract_id).await?;
    Ok(data)
}

pub async fn delete_contract_permanent_usecase(ctx: &Ctx, contract_id: String) -> Result<u64> {
    let data = ContractRepository::delete_permanent(ctx.get_db(), contract_id).await?;
    Ok(data)
}

pub async fn restore_contract_usecase(ctx: &Ctx, contract_id: String) -> Result<ContractEntity> {
    let data = ContractRepository::restore(ctx.get_db(), contract_id).await?;
    Ok(data)
}

pub async fn get_contract_by_id_usecase(ctx: &Ctx, contract_id: String) -> Result<ContractEntity> {
    let data = ContractRepository::get_by_id(ctx.get_db(), contract_id).await?;
    Ok(data)
}
