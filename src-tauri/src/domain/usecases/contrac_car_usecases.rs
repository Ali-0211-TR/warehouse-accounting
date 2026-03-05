use crate::Result;
use crate::adapters::dtos::ContractCarDTO;
use crate::domain::entities::contract_car_entity::ContractCarEntity;
use crate::domain::repositories::ContractCarRepository;
use crate::shared::ctx::Ctx;

pub async fn get_cars_usecase(ctx: &Ctx) -> Result<Vec<ContractCarEntity>> {
    let data = ContractCarRepository::get(ctx.get_db()).await?;
    Ok(data)
}

pub async fn save_car_usecase(ctx: &Ctx, car: ContractCarDTO) -> Result<ContractCarEntity> {
    let data = ContractCarRepository::save(ctx.get_db(), car).await?;
    Ok(data)
}

pub async fn delete_car_usecase(ctx: &Ctx, car_id: String) -> Result<u64> {
    let data = ContractCarRepository::delete(ctx.get_db(), car_id).await?;
    Ok(data)
}
