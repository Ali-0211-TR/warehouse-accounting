use rust_decimal::{Decimal, prelude::FromPrimitive};
use std::time::Duration;
use tokio::time::sleep;

use crate::{
    Result,
    domain::repositories::{FuelingOrderRepository, OrderRepository},
    infrastructure::repositories::order_repository::OrderManaging,
    shared::{
        ctx::{Ctx, dispenser_ops::DispenserOps},
        event::HubEvent,
        types::{BsResp, CommRequest, CommResponse, DispenserError, RequestCmd},
    },
};

pub async fn get_command(ctx: &Ctx, cmd: CommResponse) -> Result<()> {
    // Debug: Log all incoming UART responses
    // println!("📨 UART Response received: {:?}", cmd);

    match &cmd {
        CommResponse::Sh(address, _shcmd) => {
            // println!("Shelf data received: {}", address);
            // Mark dispenser as having communicated successfully
            ctx.mark_dispenser_communication(*address);
        }
        CommResponse::BS(address, bcmd) => {
            //println!("📍 BS Response from address: {}", address);
            // Mark dispenser as having communicated successfully
            ctx.mark_dispenser_communication(*address);
            let d = ctx.get_dispesner_by_adres(*address);

            if let Some(mut disp) = d {
                disp.select_nozzle_by_address(*address).ok();
                match bcmd {
                    BsResp::WriteUnitPrice(_) => {}
                    BsResp::ReadUnitPrice(_) => {}
                    BsResp::WriteSolenoid(_) => {}
                    BsResp::ReadSolenoid(_) => {}
                    BsResp::WriteDencity(_) => {}
                    BsResp::ReadDencity(_) => {}
                    BsResp::WriteAmountPreset | BsResp::WriteVolumePreset => {
                        sleep(Duration::from_millis(100)).await;
                        let c = CommRequest::Cmd(*address, RequestCmd::StartFueling);
                        ctx.send_cmd_to_disp(c);
                    }
                    BsResp::ReadPressure(_) => {}
                    BsResp::ReadFlow(_) => {}
                    BsResp::DispenserState(state) => {
                        let current_state = disp.fueling_state;

                        if current_state.card {
                            ctx.send_cmd_to_disp(CommRequest::Cmd(
                                *address,
                                RequestCmd::ReadCardId,
                            ));
                            // println!("State is start {:?}", disp.lock().unwrap().id);
                        }

                        if current_state.start {
                            ctx.send_cmd_to_disp(CommRequest::Cmd(
                                *address,
                                RequestCmd::ReadFueling,
                            ));
                            // println!("State is start {:?}", disp.lock().unwrap().id);
                        }

                        if current_state.kb_preset {
                            ctx.send_cmd_to_disp(CommRequest::Cmd(
                                *address,
                                RequestCmd::ReadPreset,
                            ));
                            // println!("State is kb_preset {:?}", disp.lock().unwrap().id);
                        }

                        disp.fueling_state = *state;

                        if current_state != *state {
                            // let dispenser = disp.clone();
                            // ctx.emit_hub_event(HubEvent::Dispenser(dispenser));
                            ctx.emit_hub_event(HubEvent::DispenserSerial(CommResponse::BS(
                                *address,
                                BsResp::DispenserState(*state),
                            )));
                        }
                    }
                    BsResp::ClearShiftTotal => {}
                    BsResp::ReadFuelingData(volume, amount) => {
                        let Some(order_id) = disp
                            .selected_nozzle()
                            .and_then(|n| n.fueling_order_id.clone())
                        else {
                            return Ok(());
                        };

                        // Single lock scope to update fueling data and check if we need to stop
                        let (fueling_order, order, should_stop, order_index) = {
                            let mut active_orders = ctx.active_orders.lock().unwrap();
                            let Some(order_pos) = active_orders
                                .iter()
                                .position(|order| order.id == Some(order_id.clone()))
                            else {
                                return Ok(());
                            };
                            let order = &mut active_orders[order_pos];

                            let Some(item) = order
                                .items
                                .iter_mut()
                                .find(|item| item.id == order.fueling_order_item_id)
                            else {
                                return Ok(());
                            };
                            let Some(fueling) = item.fueling_order.as_mut() else {
                                return Ok(());
                            };

                            // Update fueling data
                            fueling.amount = (*amount).into();
                            fueling.volume = Decimal::from_f64((*volume as f64) / 100.0).unwrap();

                            let should_stop = !disp.fueling_state.start && fueling.d_move.is_none();
                            (fueling.clone(), order.clone(), should_stop, order_pos)
                        };

                        // Handle stop fueling if needed
                        if should_stop {
                            let db = ctx.get_db().clone();
                            let stopped_order =
                                OrderRepository::stop_fueling(db, order.clone()).await?;

                            // Update the order in active_orders
                            ctx.active_orders.lock().unwrap()[order_index] = stopped_order.clone();
                            // println!("Order stopped: {:#?}", stopped_order);
                            ctx.emit_hub_event(HubEvent::ActiveOrder(Box::new(stopped_order)));
                        } else {
                            // Save fueling data and emit order update
                            let db = ctx.get_db().clone();
                            FuelingOrderRepository::save(db, fueling_order).await?;
                            ctx.emit_hub_event(HubEvent::ActiveOrder(Box::new(order)));
                        }
                    }
                    BsResp::ReadTotal(volume, amount) => {
                        println!("ReadTotal received: volume={}, amount={}", volume, amount);
                        ctx.emit_hub_event(HubEvent::DispenserSerial(CommResponse::BS(
                            *address,
                            BsResp::ReadTotal(*volume, *amount),
                        )));
                    }
                    BsResp::ReadShiftTotal(volume, amount) => {
                        println!(
                            "ReadShiftTotal received: volume={}, amount={}",
                            volume, amount
                        );
                        ctx.emit_hub_event(HubEvent::DispenserSerial(CommResponse::BS(
                            *address,
                            BsResp::ReadShiftTotal(*volume, *amount),
                        )));
                    }
                    BsResp::StartFueling(_is_start) => {

                        // disp.lock()
                        //     .unwrap()
                        //     .selected_nozzle_mut()
                        //     .and_then(|n| n.fueling_order_item.as_mut())
                        //     .ok_or(Error::Dispenser("Nozzle not found".to_owned()))?;
                    }
                    BsResp::StopFueling => {}
                    BsResp::AskForControl => {}
                    BsResp::ReturnControl => {}
                    BsResp::PauseFueling => {}
                    BsResp::ResumeFueling => {}
                    BsResp::NextNozzleSelected => {}
                    BsResp::ReadKBPreset(preset_type, value) => {
                        println!(
                            "ReadKBPreset received: type={:?}, value={}",
                            preset_type, value
                        );

                        ctx.send_cmd_to_disp(CommRequest::Cmd(
                            *address,
                            RequestCmd::ResetKbPresetFlag,
                        ));

                        ctx.emit_hub_event(HubEvent::DispenserSerial(CommResponse::BS(
                            *address,
                            BsResp::ReadKBPreset(preset_type.clone(), *value),
                        )));
                    }
                    BsResp::ReadCardId(card_id) => {
                        println!("Card ID read: {}", card_id);
                    }
                    BsResp::ReadErrorCode(error) => {
                        let e = DispenserError::try_from(*error).ok();
                        disp.error = e;
                    }
                    BsResp::ReadId(_) => {}
                    BsResp::ResetKbPresetFlag => {}
                    BsResp::ResetErrorFlag => {}
                };

                // let dispenser = disp.lock().unwrap().clone();
                // ctx.emit_hub_event(HubEvent::Dispenser(dispenser));
            }
        }
    };
    Ok(())
}
