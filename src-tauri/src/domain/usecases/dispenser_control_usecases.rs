use crate::Result;
use crate::domain::repositories::OrderRepository;
use crate::infrastructure::repositories::order_repository::OrderManaging;
use crate::shared::ctx::dispenser_ops::DispenserOps;
use crate::shared::error::Error;
use crate::shared::event::HubEvent;
use crate::shared::types::{PresetType, RequestCmd};
use crate::{
    domain::entities::dispenser_entity::DispenserEntity,
    shared::{ctx::Ctx, types::CommRequest},
};
use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use rust_decimal_macros::dec;

pub async fn select_dispenser_nozzle_usecase(ctx: &Ctx, address: u8) -> Result<()> {
    let cmd = CommRequest::Cmd(address, RequestCmd::SelectNextNozzle(address));
    ctx.send_cmd_to_disp(cmd);
    Ok(())
}

pub async fn _preset_volume_usecase(ctx: &Ctx, dispenser: DispenserEntity) -> Result<()> {
    let cmd = CommRequest::Cmd(dispenser.base_address, RequestCmd::StartFueling);
    ctx.send_cmd_to_disp(cmd);
    Ok(())
}

pub async fn start_fueling_usecase(
    ctx: &Ctx,
    address: u8,
    preset_type: PresetType,
    preset: Decimal,
    price: Decimal,
) -> Result<DispenserEntity> {
    let mut dispenser = ctx
        .get_dispesner_by_adres(address)
        .ok_or(Error::Dispenser("Dispenser not found".to_owned()))?;

    let nozzle = dispenser
        .selected_nozzle()
        .ok_or(Error::Dispenser("No nozzle selected".to_owned()))?
        .clone();

    // Get device_id from context
    let device_id = ctx.get_device_id().await?;

    let order = OrderRepository::add_dispenser_order(
        ctx.get_db().clone(),
        &nozzle,
        preset_type.clone(),
        preset,
        device_id,
    )
    .await?;

    let mut active_orders = ctx.active_orders.lock().unwrap();
    active_orders.push(order.clone());
    if let Some(n) = dispenser.selected_nozzle_mut() {
        n.fueling_order_id = order.id.clone();
    }
    ctx.emit_hub_event(HubEvent::ActiveOrder(Box::new(order)));

    let preset = (preset * dec!(100.0)).round().to_u32().unwrap_or_default();
    let price = (price * dec!(100.0)).round().to_u32().unwrap_or_default();

    let cmd = match preset_type {
        PresetType::Volume => CommRequest::Cmd(address, RequestCmd::PresetVolume(preset, price)),
        PresetType::Amount => {
            CommRequest::Cmd(address, RequestCmd::PresetAmount(preset / 100, price))
        }
    };
    ctx.send_cmd_to_disp(cmd);
    Ok(dispenser.clone())
}

pub async fn stop_fueling_usecase(ctx: &Ctx, address: u8) -> Result<()> {
    let cmd = CommRequest::Cmd(address, RequestCmd::StopFueling);
    ctx.send_cmd_to_disp(cmd);
    Ok(())
}

pub fn clear_error_usecase(ctx: &Ctx, id: String) -> Result<()> {
    let d = ctx.get_dispenser_by_id(id);
    match d {
        Some(mut disp) => {
            disp.error = None;
        }
        None => {
            return Err(Error::Dispenser("dispenser_not_found".to_owned()));
        }
    }
    Ok(())
}

pub async fn pause_fueling_usecase(ctx: &Ctx, address: u8) -> Result<()> {
    let cmd = CommRequest::Cmd(address, RequestCmd::PauseFueling);
    ctx.send_cmd_to_disp(cmd);
    Ok(())
}

pub async fn resume_fueling_usecase(ctx: &Ctx, address: u8) -> Result<()> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ResumeFueling);
    ctx.send_cmd_to_disp(cmd);
    Ok(())
}

// Write price to dispenser
pub async fn write_price_usecase(ctx: &Ctx, address: u8, price: u32) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::WritePrice(price));
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Read price from dispenser
pub async fn read_price_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ReadPrice);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Write solenoid value
pub async fn write_solenoid_usecase(ctx: &Ctx, address: u8, val: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::WriteSolenoid(val));
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Read solenoid value
pub async fn read_solenoid_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ReadSolenoid);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Preset amount
pub async fn preset_amount_usecase(ctx: &Ctx, address: u8, val: u32, price: u32) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::PresetAmount(val, price));
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Preset volume
pub async fn preset_volume_usecase(ctx: &Ctx, address: u8, val: u32, price: u32) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::PresetVolume(val, price));
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Read fueling
pub async fn read_fueling_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ReadFueling);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Read total
pub async fn read_total_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ReadTotal);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Read shift total
pub async fn read_shift_total_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ReadShiftTotal);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Ask control
pub async fn ask_control_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::AskControl);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Return control
pub async fn return_control_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ReturnControl);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Clear shift total
pub async fn clear_shift_total_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ClearShiftTotal);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Read preset
pub async fn read_preset_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ReadPreset);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Read card id
pub async fn read_card_id_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ReadCardId);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Read error code
pub async fn read_error_code_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ReadErrorCode);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Read id
pub async fn read_id_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ReadId);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Reset kb preset flag
pub async fn reset_kb_preset_flag_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ResetKbPresetFlag);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Reset error flag
pub async fn reset_error_flag_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ResetErrorFlag);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Read pressure
pub async fn read_pressure_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ReadPressure);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Read flow
pub async fn read_flow_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ReadFlow);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Read dencity
pub async fn read_dencity_usecase(ctx: &Ctx, address: u8) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::ReadDencity);
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}

// Write dencity
pub async fn write_dencity_usecase(ctx: &Ctx, address: u8, dencity: u16) -> Result<bool> {
    let cmd = CommRequest::Cmd(address, RequestCmd::WriteDencity(dencity));
    ctx.send_cmd_to_disp(cmd);
    Ok(true)
}
