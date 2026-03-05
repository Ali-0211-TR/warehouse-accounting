use crate::{
    Error,
    adapters::{
        dtos::{
            AddressDTO, DispenserStartDTO, IdDTO, PresetDTO, SetDencityDTO, SetPriceDTO,
            SetSolenoidDTO,
        },
        response::IpcResponse,
    },
    domain::{
        entities::dispenser_entity::DispenserEntity,
        usecases::dispenser_control_usecases::{
            clear_error_usecase, pause_fueling_usecase, resume_fueling_usecase,
            select_dispenser_nozzle_usecase, start_fueling_usecase, stop_fueling_usecase,
        },
    },
    shared::ctx::Ctx,
};
use tauri::{AppHandle, Wry};

#[tauri::command(rename_all = "snake_case")]
pub async fn start_fueling(
    app: AppHandle<Wry>,
    params: DispenserStartDTO,
) -> IpcResponse<DispenserEntity> {
    crate::ipc_handler_async!({
        println!(
            "Command received: start_fueling with params: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        ctx.active_shift
            .lock()
            .unwrap()
            .clone()
            .ok_or(Error::Dispenser("shift_is_not_opened".to_owned()))?;

        let dispenser = start_fueling_usecase(
            &ctx,
            params.address,
            params.preset_type,
            params.preset,
            params.price,
        )
        .await?;
        Ok(dispenser)
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn stop_fueling(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<()> {
    crate::ipc_handler_async!({
        println!(
            "Command received: stop_fueling with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        stop_fueling_usecase(&ctx, params.address).await
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn pause_fueling(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<()> {
    crate::ipc_handler_async!({
        println!(
            "Command received: pause_fueling with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        pause_fueling_usecase(&ctx, params.address).await
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn clear_error(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<()> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        clear_error_usecase(&ctx, params.id)
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn write_price(app: AppHandle<Wry>, params: SetPriceDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: write_price with address: {:?}, price: {}",
            params.address, params.price
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::write_price_usecase(
            &ctx,
            params.address,
            params.price,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_price(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: read_price with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::read_price_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn write_solenoid(app: AppHandle<Wry>, params: SetSolenoidDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: write_solenoid with address: {:?}, value: {}",
            params.address, params.value
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::write_solenoid_usecase(
            &ctx,
            params.address,
            params.value,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_solenoid(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: read_solenoid with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::read_solenoid_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn preset_amount(app: AppHandle<Wry>, params: PresetDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: preset_amount with address: {:?}, value: {}, price: {}",
            params.address, params.value, params.price
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::preset_amount_usecase(
            &ctx,
            params.address,
            params.value,
            params.price,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn preset_volume(app: AppHandle<Wry>, params: PresetDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: preset_volume with address: {:?}, value: {}, price: {}",
            params.address, params.value, params.price
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::preset_volume_usecase(
            &ctx,
            params.address,
            params.value,
            params.price,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_fueling(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: read_fueling with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::read_fueling_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_total(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: read_total with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::read_total_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_shift_total(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: read_shift_total with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::read_shift_total_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn ask_control(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: ask_control with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::ask_control_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn return_control(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: return_control with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::return_control_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn clear_shift_total(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: clear_shift_total with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::clear_shift_total_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn resume_fueling(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<()> {
    crate::ipc_handler_async!({
        println!(
            "Command received: resume_fueling with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        resume_fueling_usecase(&ctx, params.address).await
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn select_next_nozzle(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<()> {
    crate::ipc_handler_async!({
        println!(
            "Command received: select_next_nozzle with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        select_dispenser_nozzle_usecase(&ctx, params.address).await
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_preset(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: read_preset with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::read_preset_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_card_id(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: read_card_id with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::read_card_id_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_error_code(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: read_error_code with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::read_error_code_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_id(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: read_id with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::read_id_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn reset_kb_preset_flag(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: reset_kb_preset_flag with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::reset_kb_preset_flag_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn reset_error_flag(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: reset_error_flag with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::reset_error_flag_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_pressure(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: read_pressure with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::read_pressure_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_flow(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: read_flow with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::read_flow_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_dencity(app: AppHandle<Wry>, params: AddressDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: read_dencity with address: {:?}",
            params.address
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::read_dencity_usecase(
            &ctx,
            params.address,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn write_dencity(app: AppHandle<Wry>, params: SetDencityDTO) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        println!(
            "Command received: write_dencity with address: {:?}, density: {}",
            params.address, params.dencity
        );
        let ctx = Ctx::from_app(app)?;
        match crate::domain::usecases::dispenser_control_usecases::write_dencity_usecase(
            &ctx,
            params.address,
            params.dencity,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    })
}
