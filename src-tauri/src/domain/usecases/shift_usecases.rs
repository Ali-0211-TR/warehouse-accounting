use crate::Result;
use crate::adapters::dtos::{LazyTableStateDTO, PaginatorDTO};
use crate::domain::entities::shift_entity::{ShiftColumn, ShiftData, ShiftEntity, ShiftFilter};
use crate::domain::repositories::{ShiftRepository, UserRepository};
use crate::shared::ctx::Ctx;
use crate::shared::error::Error;

pub async fn get_shifts_usecase(
    ctx: &Ctx,
    filter: LazyTableStateDTO<ShiftFilter, ShiftColumn>,
) -> Result<PaginatorDTO<ShiftEntity>> {
    let data = ShiftRepository::get(ctx.get_db(), filter).await?;
    Ok(data)
}

pub async fn close_shift_usecase(ctx: &Ctx, data_close: Vec<ShiftData>) -> Result<ShiftEntity> {
    println!("User close: {:?}", ctx.user.lock().unwrap());
    let user_close = ctx
        .user
        .lock()
        .unwrap()
        .clone()
        .ok_or(Error::Dispenser("User is not logged in".to_owned()))?;

    let data = ShiftRepository::close_shift(ctx.get_db(), user_close, data_close).await?;
    ctx.active_shift.lock().unwrap().take();
    Ok(data)
}

pub async fn open_shift_usecase(ctx: &Ctx, open_shift: Vec<ShiftData>) -> Result<ShiftEntity> {
    println!("User open: {:?}", ctx.user.lock().unwrap());
    let user_open = ctx
        .user
        .lock()
        .unwrap()
        .clone()
        .ok_or(Error::Dispenser("User is not logged in".to_owned()))?;

    println!("User ID for shift: {:?}", user_open.id);
    println!("Shift data: {:?}", open_shift);

    // Verify user exists in database
    let user_id = user_open
        .id
        .clone()
        .ok_or(Error::Dispenser("User ID is None".to_owned()))?;
    match UserRepository::get_by_id(ctx.get_db(), user_id.clone()).await {
        Ok(db_user) => println!("User exists in DB: {:?}", db_user.id),
        Err(e) => {
            println!(
                "ERROR: User does not exist in DB! User ID: {}, Error: {:?}",
                user_id, e
            );
            return Err(Error::Dispenser(format!(
                "User with ID {} not found in database",
                user_id
            )));
        }
    }

    let data = ShiftRepository::open_shift(ctx.get_db(), user_open, open_shift).await?;
    ctx.active_shift.lock().unwrap().replace(data.clone());
    Ok(data)
}

pub async fn delete_shift_usecase(ctx: &Ctx, shift_id: String) -> Result<u64> {
    let data = ShiftRepository::delete(ctx.get_db(), shift_id).await?;
    Ok(data)
}
