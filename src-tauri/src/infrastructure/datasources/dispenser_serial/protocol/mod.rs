use consts::*;
use util::*;

use crate::shared::types::{ActDispState, BsResp, CommResponse, FuelingType, PresetType, ShResp};

mod consts;
mod util;

static mut IND: u8 = 0;

pub trait CTransmitter {
    fn get_status(&self, buff: &mut [u8], address: u8) -> usize;
    fn start_fueling(&self, buff: &mut [u8], address: u8) -> usize;
    fn write_price(&self, buff: &mut [u8], address: u8, price: u32) -> usize;
    fn read_price(&self, buff: &mut [u8], address: u8) -> usize;
    fn write_solenoid(&self, buff: &mut [u8], address: u8, val: u8) -> usize;
    fn read_solenoid(&self, buff: &mut [u8], address: u8) -> usize;
    fn preset_amount(&self, buff: &mut [u8], address: u8, val: u32, price: u32) -> usize;
    fn preset_volume(&self, buff: &mut [u8], address: u8, val: u32, price: u32) -> usize;
    fn read_fueling(&self, buff: &mut [u8], address: u8) -> usize;
    fn read_total(&self, buff: &mut [u8], address: u8) -> usize;
    fn read_shift_total(&self, buff: &mut [u8], address: u8) -> usize;
    fn stop_fueling(&self, buff: &mut [u8], address: u8) -> usize;
    fn ask_control(&self, buff: &mut [u8], address: u8) -> usize;
    fn return_control(&self, buff: &mut [u8], address: u8) -> usize;
    fn clear_shift_total(&self, buff: &mut [u8], address: u8) -> usize;
    fn pause_fueling(&self, buff: &mut [u8], address: u8) -> usize;
    fn resume_fueling(&self, buff: &mut [u8], address: u8) -> usize;
    fn select_next_nozzle(&self, buff: &mut [u8], address: u8, dest_address: u8) -> usize;
    fn read_preset(&self, buff: &mut [u8], address: u8) -> usize;
    fn read_card_id(&self, buff: &mut [u8], address: u8) -> usize;
    fn read_error_code(&self, buff: &mut [u8], address: u8) -> usize;
    fn read_id(&self, buff: &mut [u8], address: u8) -> usize;
    fn reset_kb_preset_flag(&self, buff: &mut [u8], address: u8) -> usize;
    fn reset_error_flag(&self, buff: &mut [u8], address: u8) -> usize;
    fn read_pressure(&self, buff: &mut [u8], address: u8) -> usize;
    fn read_flow(&self, buff: &mut [u8], address: u8) -> usize;
    fn read_dencity(&self, buff: &mut [u8], address: u8) -> usize;
    fn write_dencity(&self, buff: &mut [u8], address: u8, dencity: u16) -> usize;
}

pub trait CReceiver {
    fn validate(&mut self, data: Vec<u8>) -> bool;
    // fn get_len(&mut self, data: Vec<u8>) -> usize;
    // fn validate_beinging(&mut self, data: u8) -> bool;
    fn receive(&mut self, data: Vec<u8>) -> Result<CommResponse, ()>;
}

//================================================================
pub struct RxShelf {
    status: ActDispState,
}

impl RxShelf {
    pub fn new() -> Self {
        let status = ActDispState {
            pist: 0,
            is_start: false,
            hvalve: false,
            lvalve: false,
            is_motor: false,
            is_pause: false,
            is_keyboard: false,
            is_fueling: false,
        };
        RxShelf { status }
    }
}

pub struct RxBlueSky {
    // status: ActDispState,
}

impl RxBlueSky {
    pub fn new() -> Self {
        // let status = ActDispState {
        //     pist: 0,
        //     is_start: false,
        //     hvalve: false,
        //     lvalve: false,
        //     is_motor: false,
        //     is_pause: false,
        //     is_keyboard: false,
        //     is_fueling: false,
        // };
        RxBlueSky {}
    }
}

impl CReceiver for RxShelf {
    fn receive(&mut self, data: Vec<u8>) -> Result<CommResponse, ()> {
        if self.validate(data.clone()) {
            unsafe { IND = data[2] };
            let addr = data[1];
            match data[4] {
                SH_RESP_CCR => return Ok(CommResponse::Sh(addr, ShResp::CommandOk())),
                SH_RESP_CBR => return Ok(CommResponse::Sh(addr, ShResp::CommandBad())),
                SH_RESP_SSR => {
                    self.status = ActDispState::new_from_sh_bytes(data[5], data[6]);
                    return Ok(CommResponse::Sh(addr, ShResp::StopStatus(self.status)));
                }
                SH_RESP_AKR => {
                    self.status = ActDispState::new_from_sh_bytes(data[5], data[6]);

                    return Ok(CommResponse::Sh(
                        addr,
                        ShResp::ActiveKeyboard(
                            FuelingType::from_sh(data[7]),
                            self.status,
                            conv_3bytes_to_int(&data[11..14]),
                        ),
                    ));
                }
                SH_RESP_AKRR => {
                    self.status = ActDispState::new_from_sh_bytes(data[5], data[6]);
                    return Ok(CommResponse::Sh(
                        addr,
                        ShResp::ActiveKeyboardRequest(
                            FuelingType::from_sh(data[7]),
                            self.status,
                            conv_3bytes_to_int(&data[11..14]),
                        ),
                    ));
                }
                SH_RESP_AMAG => {
                    // println!("dispensers: {:x}", data);
                    self.status = ActDispState::new_from_sh_bytes(data[5], data[6]);
                    return Ok(CommResponse::Sh(
                        addr,
                        ShResp::ActiveModeActiveGun(
                            self.status,
                            FuelingType::from_sh(data[7]),
                            data[8],
                            conv_3bytes_to_int(&data[9..12]),
                        ),
                    ));
                }
                SH_RESP_AMNAG => {
                    self.status = ActDispState::new_from_sh_bytes(data[5], data[6]);
                    return Ok(CommResponse::Sh(
                        addr,
                        ShResp::ActiveModeNoActiveGun(
                            self.status,
                            FuelingType::from_sh(data[7]),
                            data[8],
                            conv_3bytes_to_int(&data[9..12]),
                        ),
                    ));
                }
                SH_RESP_RPR => {
                    let r =
                        CommResponse::Sh(addr, ShResp::ReadPrice(conv_2bytes_to_int(&data[5..7])));
                    return Ok(r);
                }
                SH_RESP_CAR => {
                    self.status = ActDispState::new_from_sh_bytes(data[5], data[6]);
                    return Ok(CommResponse::Sh(
                        addr,
                        ShResp::CurrentAmount(
                            self.status,
                            FuelingType::from_sh(data[7]),
                            data[8],
                            conv_3bytes_to_int(&data[9..12]),
                        ),
                    ));
                }
                SH_RESP_MAR => {
                    self.status = ActDispState::new_from_sh_bytes(data[5], data[6]);
                    return Ok(CommResponse::Sh(
                        addr,
                        ShResp::MadeAmountResponse(
                            self.status,
                            conv_3bytes_to_int(&data[7..10]),
                            conv_3bytes_to_int(&data[10..13]),
                            conv_2bytes_to_int(&data[13..15]),
                        ),
                    ));
                }
                SH_RESP_RVC => {
                    return Ok(CommResponse::Sh(
                        addr,
                        ShResp::ReadVolumeOfChange(conv_3bytes_to_int(&data[5..8])),
                    ));
                }
                SH_RESP_RVCC => {
                    return Ok(CommResponse::Sh(
                        addr,
                        ShResp::ReadVolumeOfNonCache(conv_3bytes_to_int(&data[5..8])),
                    ));
                }
                SH_RESP_CMCR => {
                    return Ok(CommResponse::Sh(
                        addr,
                        ShResp::CacheMoneyOfChange(conv_3bytes_to_int(&data[5..8])),
                    ));
                }
                SH_RESP_PVCR => {
                    return Ok(CommResponse::Sh(
                        addr,
                        ShResp::PassageVolumeOfChange(conv_3bytes_to_int(&data[5..8])),
                    ));
                }
                SH_RESP_TCR => {
                    return Ok(CommResponse::Sh(
                        addr,
                        ShResp::TotalCounter(conv_4bytes_to_int(&data[5..9])),
                    ));
                }
                SH_RESP_DRR => {
                    return Ok(CommResponse::Sh(
                        addr,
                        ShResp::Dencity(conv_3bytes_to_int(&data[5..8])),
                    ));
                }
                SH_RESP_PRR => {
                    return Ok(CommResponse::Sh(
                        addr,
                        ShResp::Pressure(conv_3bytes_to_int(&data[5..8])),
                    ));
                }
                _ => (),
            }
        } else {
            //println!("Unvalidated {:x}", data);
        }
        Err(())
    }

    #[inline]
    fn validate(&mut self, _data: Vec<u8>) -> bool {
        true
        // data.len() > 5 && data.len() == data[3].into()
    }

    // fn validate_beinging(&mut self, data: u8) -> bool {
    //     data == SH_PCODE
    // }

    // fn get_len(&mut self, data: Vec<u8>) -> usize {
    //     data[3] as usize
    // }
}

impl CReceiver for RxBlueSky {
    fn receive(&mut self, data: Vec<u8>) -> Result<CommResponse, ()> {
        let l = data.len();
        if self.validate(data.clone()) {
            let addr = data[1];
            // println!("Data addr: {:x} cmd: {:x}", addr, data[l - 2]);
            match data[l - 2] {
                BS_WRITE_PRICE => {
                    let res = data[3] == 0x59; //0x4E
                    return Ok(CommResponse::BS(addr, BsResp::WriteUnitPrice(res)));
                }
                BS_READ_PRICE => {
                    let res = bs_conv_3bytes_to_int(&data[3..6]);
                    return Ok(CommResponse::BS(addr, BsResp::ReadUnitPrice(res)));
                }
                BS_WRITE_SOLENOID => {
                    let res = data[3] == 0x59; //0x4E
                    return Ok(CommResponse::BS(addr, BsResp::WriteSolenoid(res)));
                }
                BS_READ_SOLENOID => {
                    let res = bs_conv_2bytes_to_int(&data[3..5]);
                    return Ok(CommResponse::BS(addr, BsResp::ReadSolenoid(res)));
                }
                BS_WRITE_DENCITY => {
                    return Ok(CommResponse::BS(addr, BsResp::WriteDencity(true)));
                }
                BS_READ_DENCITY => {
                    let res = bs_conv_2bytes_to_int(&data[3..5]);
                    return Ok(CommResponse::BS(addr, BsResp::ReadDencity(res)));
                }
                BS_PRESET_AMOUNT => {
                    //println!("R preset amount: {:x}", data);
                    return Ok(CommResponse::BS(addr, BsResp::WriteAmountPreset));
                }
                BS_PRESET_VOLUME => {
                    // println!("GET preset volume: {:x}", addr);
                    return Ok(CommResponse::BS(addr, BsResp::WriteVolumePreset));
                }
                BS_READ_DISPENSER_STATE_BIT => {
                    // println!("Read State: {:x}", data[3]);
                    return Ok(CommResponse::BS(addr, BsResp::get_state(data[3])));
                }
                BS_READ_FUELING_DATA => {
                    //println!("B read volume: {:x}", data);
                    let volume = bs_conv_4bytes_to_int(&data[3..7]);
                    let amount = bs_conv_4bytes_to_int(&data[7..11]);
                    return Ok(CommResponse::BS(
                        addr,
                        BsResp::ReadFuelingData(volume, amount),
                    ));
                }
                BS_READ_TOTAL => {
                    //println!("Total data: {:x}", data);
                    let volume = bs_conv_6bytes_to_int(&data[3..9]);
                    let amount = bs_conv_6bytes_to_int(&data[9..15]);

                    return Ok(CommResponse::BS(addr, BsResp::ReadTotal(volume, amount)));
                }
                BS_READ_SHIFT_TOTAL => {
                    let volume = bs_conv_6bytes_to_int(&data[3..9]);
                    let amount = bs_conv_6bytes_to_int(&data[9..15]);
                    // let volume = bs_conv_5bytes_to_int(&data[4..9]);
                    // let amount = bs_conv_5bytes_to_int(&data[9..15]);
                    //println!("R REad shift total  {:x} {} {}", data, volume, amount);
                    return Ok(CommResponse::BS(
                        addr,
                        BsResp::ReadShiftTotal(volume, amount),
                    ));
                }
                BS_START_FUELING => {
                    println!("R Recieve start ");
                    let addr = data[1];
                    let res = data[3] == 0x59; //0x4E
                    return Ok(CommResponse::BS(addr, BsResp::StartFueling(res)));
                }
                BS_STOP_FUELING => {
                    println!("R Recieve stop ");
                    return Ok(CommResponse::BS(addr, BsResp::StopFueling));
                }
                BS_ASK_FOR_CONTROL => {
                    return Ok(CommResponse::BS(addr, BsResp::AskForControl));
                }
                BS_RETURN_CONTROL => {
                    return Ok(CommResponse::BS(addr, BsResp::ReturnControl));
                }
                BS_CLEAR_SHIFT_TOTAL => {
                    return Ok(CommResponse::BS(addr, BsResp::ClearShiftTotal));
                }
                BS_PAUSE_FUELING => {
                    println!("R Recieve pause ");
                    return Ok(CommResponse::BS(addr, BsResp::PauseFueling));
                }
                BS_RESUME_FUELING => {
                    return Ok(CommResponse::BS(addr, BsResp::ResumeFueling));
                }
                BS_SELECT_NOZZLE => {
                    return Ok(CommResponse::BS(addr, BsResp::NextNozzleSelected));
                }
                BS_READ_PRESET => {
                    let preset_type = if data[3] == 0 {
                        PresetType::Volume
                    } else {
                        PresetType::Amount
                    };
                    let val = bs_conv_4bytes_to_int(&data[4..8]);
                    return Ok(CommResponse::BS(
                        addr,
                        BsResp::ReadKBPreset(preset_type, val),
                    ));
                }
                BS_READ_CARD_ID => {
                    let id = bs_conv_5bytes_to_int(&data[3..8]);
                    return Ok(CommResponse::BS(addr, BsResp::ReadCardId(id)));
                }
                BS_READ_ERROR_CODE => {
                    let err = data[3];
                    return Ok(CommResponse::BS(addr, BsResp::ReadErrorCode(err)));
                }
                BS_READ_ID => {
                    let id = bs_conv_4bytes_to_int(&data[3..7]);
                    return Ok(CommResponse::BS(addr, BsResp::ReadId(id)));
                }
                BS_RESET_KB_PRESET_FLAG => {
                    return Ok(CommResponse::BS(addr, BsResp::ResetKbPresetFlag));
                }
                BS_RESET_ERROR_FLAG => {
                    return Ok(CommResponse::BS(addr, BsResp::ResetErrorFlag));
                }

                BS_READ_PRESSURE => {
                    let res = bs_conv_2bytes_to_int(&data[3..5]);
                    return Ok(CommResponse::BS(addr, BsResp::ReadPressure(res)));
                }
                BS_READ_FLOW => {
                    let res = bs_conv_2bytes_to_int(&data[3..5]);
                    return Ok(CommResponse::BS(addr, BsResp::ReadFlow(res)));
                }

                _ => {}
            }
        }
        Err(())
    }

    #[inline]
    fn validate(&mut self, data: Vec<u8>) -> bool {
        let l = data.len();
        data[l - 1] == bs_crc(&data[0..(l - 1)])
    }
    // #[inline]
    // fn validate_beinging(&mut self, data: u8) -> bool {
    //     data == BS_PCODE
    // }
    // #[inline]
    // fn get_len(&mut self, data: Vec<u8>) -> usize {
    //     ((data[2] & 0x0F) + 3) as usize
    // }
}

//================================================================

pub struct TxShelf {}

pub struct TxBlueSky {}

impl CTransmitter for TxShelf {
    fn start_fueling(&self, buff: &mut [u8], address: u8) -> usize {
        unsafe {
            (IND, _) = IND.overflowing_add(1);
            let mut data = [SH_PCODE, address, IND, 0x07, SH_SETSTARTPAUZA, 0, 0];
            let l = data.len();
            sh_crc(&mut data);
            buff[0..l].copy_from_slice(&data);
            l
        }
    }
    fn get_status(&self, buff: &mut [u8], address: u8) -> usize {
        unsafe {
            (IND, _) = IND.overflowing_add(1);
            let mut data = [SH_PCODE, address, IND, 0x07, SH_GETSTATUS, 0, 0];
            let l = data.len();
            sh_crc(&mut data);
            buff[0..l].copy_from_slice(&data);
            l
        }
    }

    fn write_price(&self, buff: &mut [u8], address: u8, price: u32) -> usize {
        unsafe {
            (IND, _) = IND.overflowing_add(1);
            let mut data = [SH_PCODE, address, IND, 0x09, SH_SETPRICE, 0, 0, 0, 0];
            conv_u16_to_2byte(&mut data[5..7], price as u16);
            let l = data.len();
            sh_crc(&mut data);
            buff[0..l].copy_from_slice(&data);
            l
        }
    }

    fn read_price(&self, buff: &mut [u8], address: u8) -> usize {
        unsafe {
            (IND, _) = IND.overflowing_add(1);
            let mut data = [SH_PCODE, address, IND, 0x07, SH_GETPRICE, 0, 0];
            let l = data.len();
            sh_crc(&mut data);
            buff[0..l].copy_from_slice(&data);
            l
        }
    }

    fn write_solenoid(&self, buff: &mut [u8], address: u8, _: u8) -> usize {
        self.get_status(buff, address)
    }

    fn read_solenoid(&self, buff: &mut [u8], address: u8) -> usize {
        self.get_status(buff, address)
    }

    fn preset_amount(&self, buff: &mut [u8], address: u8, val: u32, price: u32) -> usize {
        unsafe {
            (IND, _) = IND.overflowing_add(1);
            let mut data = [
                SH_PCODE,
                address,
                IND,
                0x0E,
                SH_SETPUSKSUMMA,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            ];
            conv_u32_to_3byte(&mut data[7..10], val);
            conv_u16_to_2byte(&mut data[10..12], price as u16);
            let l = data.len();
            sh_crc(&mut data);
            buff[0..l].copy_from_slice(&data);
            l
            // (ind, _) = ind.overflowing_add(1);
            // let mut data = [SH_PCODE, address, ind, 0x0A, SH_SETPUSKSUMMA, 0, 0, 0, 0, 0];
            // conv_u32_to_3byte(&mut data[5..8], val);
            // let l = data.len();
            // sh_crc(&mut data);
            // buff[0..l].copy_from_slice(&data);
            // l
        }
    }

    fn preset_volume(&self, buff: &mut [u8], address: u8, val: u32, price: u32) -> usize {
        unsafe {
            (IND, _) = IND.overflowing_add(1);
            let mut data = [
                SH_PCODE,
                address,
                IND,
                0x0E,
                SH_SETPUSKLITR,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            ];
            conv_u32_to_3byte(&mut data[7..10], val);
            conv_u16_to_2byte(&mut data[10..12], price as u16);
            let l = data.len();
            sh_crc(&mut data);
            buff[0..l].copy_from_slice(&data);
            // println!("Preset volume {:x}", l);
            l
        }
    }

    fn read_fueling(&self, buff: &mut [u8], address: u8) -> usize {
        self.get_status(buff, address)
    }

    fn read_total(&self, buff: &mut [u8], address: u8) -> usize {
        unsafe {
            (IND, _) = IND.overflowing_add(1);
            let mut data = [SH_PCODE, address, IND, 0x07, SH_GETTOTALLITR, 0, 0];
            let l = data.len();
            sh_crc(&mut data);
            buff[0..l].copy_from_slice(&data);
            l
        }
    }

    fn read_shift_total(&self, buff: &mut [u8], address: u8) -> usize {
        unsafe {
            (IND, _) = IND.overflowing_add(1);
            let mut data = [SH_PCODE, address, IND, 0x07, SH_GETSMENALITR, 0, 0];
            let l = data.len();
            sh_crc(&mut data);
            buff[0..l].copy_from_slice(&data);
            l
        }

        // //================================================================
        // unsafe{(ind, _) = ind.overflowing_add(1);}
        // let mut data = [SH_PCODE, address, ind, 0x07, SH_GETSMENASUMMA, 0, 0];
        // sh_crc(&mut data);
        // //self.tx = send(&data, &mut self.tx);

        // Ok(())
    }

    fn stop_fueling(&self, buff: &mut [u8], address: u8) -> usize {
        unsafe {
            (IND, _) = IND.overflowing_add(1);
            let mut data = [SH_PCODE, address, IND, 0x07, SH_SETSTOP, 0, 0];
            let l = data.len();
            sh_crc(&mut data);
            buff[0..l].copy_from_slice(&data);
            //println!("Shelf stopping {:x}", buff[0..l]);
            l
        }
    }

    fn ask_control(&self, buff: &mut [u8], address: u8) -> usize {
        unsafe {
            (IND, _) = IND.overflowing_add(1);
            let mut data = [SH_PCODE, address, IND, 0x07, SH_SETKBOFF, 0, 0];
            let l = data.len();
            sh_crc(&mut data);
            buff[0..l].copy_from_slice(&data);
            l
        }
    }

    fn return_control(&self, buff: &mut [u8], address: u8) -> usize {
        unsafe {
            (IND, _) = IND.overflowing_add(1);
            let mut data = [SH_PCODE, address, IND, 0x07, SH_SETKBON, 0, 0];
            let l = data.len();
            sh_crc(&mut data);
            buff[0..l].copy_from_slice(&data);
            l
        }
    }

    fn clear_shift_total(&self, buff: &mut [u8], address: u8) -> usize {
        unsafe {
            (IND, _) = IND.overflowing_add(1);
            let mut data = [SH_PCODE, address, IND, 0x07, SH_SETZAKRITSMENU, 0, 0];
            let l = data.len();
            sh_crc(&mut data);
            buff[0..l].copy_from_slice(&data);
            l
        }
    }

    fn pause_fueling(&self, buff: &mut [u8], address: u8) -> usize {
        unsafe {
            (IND, _) = IND.overflowing_add(1);
            let mut data = [SH_PCODE, address, IND, 0x07, SH_SETPAUSEMETAN, 0, 0];
            let l = data.len();
            sh_crc(&mut data);
            buff[0..l].copy_from_slice(&data);
            l
        }
    }

    fn resume_fueling(&self, buff: &mut [u8], address: u8) -> usize {
        unsafe {
            (IND, _) = IND.overflowing_add(1);
            let mut data = [SH_PCODE, address, IND, 0x07, SH_SETSTARTPAUZA, 0, 0];
            let l = data.len();
            sh_crc(&mut data);
            buff[0..l].copy_from_slice(&data);
            l
        }
    }

    fn select_next_nozzle(&self, buff: &mut [u8], address: u8, dest_address: u8) -> usize {
        // Example command code, replace with actual protocol value
        const CMD_SELECT_NEXT_NOZZLE: u8 = 0x21;
        let mut idx = 0;
        buff[idx] = address;
        idx += 1;
        buff[idx] = CMD_SELECT_NEXT_NOZZLE;
        idx += 1;
        buff[idx] = dest_address;
        idx += 1;
        idx
    }

    fn read_preset(&self, buff: &mut [u8], address: u8) -> usize {
        const CMD_READ_PRESET: u8 = 0x22;
        let mut idx = 0;
        buff[idx] = address;
        idx += 1;
        buff[idx] = CMD_READ_PRESET;
        idx += 1;
        idx
    }

    fn read_card_id(&self, buff: &mut [u8], address: u8) -> usize {
        const CMD_READ_CARD_ID: u8 = 0x23;
        let mut idx = 0;
        buff[idx] = address;
        idx += 1;
        buff[idx] = CMD_READ_CARD_ID;
        idx += 1;
        idx
    }

    fn read_error_code(&self, buff: &mut [u8], address: u8) -> usize {
        const CMD_READ_ERROR_CODE: u8 = 0x24;
        let mut idx = 0;
        buff[idx] = address;
        idx += 1;
        buff[idx] = CMD_READ_ERROR_CODE;
        idx += 1;
        idx
    }

    fn read_id(&self, buff: &mut [u8], address: u8) -> usize {
        const CMD_READ_ID: u8 = 0x25;
        let mut idx = 0;
        buff[idx] = address;
        idx += 1;
        buff[idx] = CMD_READ_ID;
        idx += 1;
        idx
    }

    fn reset_kb_preset_flag(&self, buff: &mut [u8], address: u8) -> usize {
        const CMD_RESET_KB_PRESET_FLAG: u8 = 0x26;
        let mut idx = 0;
        buff[idx] = address;
        idx += 1;
        buff[idx] = CMD_RESET_KB_PRESET_FLAG;
        idx += 1;
        idx
    }

    fn reset_error_flag(&self, buff: &mut [u8], address: u8) -> usize {
        const CMD_RESET_ERROR_FLAG: u8 = 0x27;
        let mut idx = 0;
        buff[idx] = address;
        idx += 1;
        buff[idx] = CMD_RESET_ERROR_FLAG;
        idx += 1;
        idx
    }

    fn read_pressure(&self, buff: &mut [u8], address: u8) -> usize {
        const CMD_READ_PRESSURE: u8 = 0x28;
        let mut idx = 0;
        buff[idx] = address;
        idx += 1;
        buff[idx] = CMD_READ_PRESSURE;
        idx += 1;
        idx
    }

    fn read_flow(&self, buff: &mut [u8], address: u8) -> usize {
        const CMD_READ_FLOW: u8 = 0x29;
        let mut idx = 0;
        buff[idx] = address;
        idx += 1;
        buff[idx] = CMD_READ_FLOW;
        idx += 1;
        idx
    }

    fn read_dencity(&self, buff: &mut [u8], address: u8) -> usize {
        const CMD_READ_DENCITY: u8 = 0x2A;
        let mut idx = 0;
        buff[idx] = address;
        idx += 1;
        buff[idx] = CMD_READ_DENCITY;
        idx += 1;
        idx
    }

    fn write_dencity(&self, buff: &mut [u8], address: u8, dencity: u16) -> usize {
        const CMD_WRITE_DENCITY: u8 = 0x2B;
        let mut idx = 0;
        buff[idx] = address;
        idx += 1;
        buff[idx] = CMD_WRITE_DENCITY;
        idx += 1;
        let dencity_bytes = dencity.to_le_bytes();
        buff[idx] = dencity_bytes[0];
        idx += 1;
        buff[idx] = dencity_bytes[1];
        idx += 1;
        idx
    }
}

impl CTransmitter for TxBlueSky {
    fn get_status(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_READ_DISPENSER_STATE_BIT, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn start_fueling(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_START_FUELING, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn write_price(&self, buff: &mut [u8], address: u8, price: u32) -> usize {
        let mut data = [BS_PCODE, address, 0xa5, 0, 0, 0, BS_WRITE_PRICE, 0];
        bs_conv_u32_to_3byte(&mut data[3..6], price);
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn read_price(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_READ_PRICE, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn write_solenoid(&self, buff: &mut [u8], address: u8, val: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa3, val, BS_WRITE_SOLENOID, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn read_solenoid(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_READ_SOLENOID, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn preset_amount(&self, buff: &mut [u8], address: u8, val: u32, _: u32) -> usize {
        let mut data = [BS_PCODE, address, 0xa6, 0, 0, 0, 0, BS_PRESET_AMOUNT, 0];
        bs_conv_u32_to_4byte(&mut data[3..7], val);
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn preset_volume(&self, buff: &mut [u8], address: u8, val: u32, _: u32) -> usize {
        let mut data = [BS_PCODE, address, 0xa6, 0, 0, 0, 0, BS_PRESET_VOLUME, 0];
        bs_conv_u32_to_4byte(&mut data[3..7], val);
        //println!("S Preset volume: {:x}", data);
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn read_fueling(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_READ_FUELING_DATA, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn read_total(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_READ_TOTAL, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn read_shift_total(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_READ_SHIFT_TOTAL, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        //println!("Uart READ SHIFT total {} {:x}", address, data);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn stop_fueling(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_STOP_FUELING, 0x00];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn ask_control(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_ASK_FOR_CONTROL, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn return_control(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_RETURN_CONTROL, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn clear_shift_total(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_CLEAR_SHIFT_TOTAL, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn pause_fueling(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_PAUSE_FUELING, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn resume_fueling(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_RESUME_FUELING, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn select_next_nozzle(&self, buff: &mut [u8], address: u8, dest_address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa3, dest_address, BS_SELECT_NOZZLE, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn read_preset(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_READ_PRESET, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn read_card_id(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_READ_CARD_ID, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn read_error_code(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_READ_ERROR_CODE, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn read_id(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_READ_ID, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn reset_kb_preset_flag(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_RESET_KB_PRESET_FLAG, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        // println!("REset kb preset flag: {:x}", buff[0..l]);
        l
    }

    fn reset_error_flag(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_RESET_ERROR_FLAG, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn read_pressure(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_READ_PRESSURE, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn read_flow(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_READ_FLOW, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn read_dencity(&self, buff: &mut [u8], address: u8) -> usize {
        let mut data = [BS_PCODE, address, 0xa2, BS_READ_DENCITY, 0];
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        // info!("Read Dencity {:x}", data);
        buff[0..l].copy_from_slice(&data);
        l
    }

    fn write_dencity(&self, buff: &mut [u8], address: u8, dencity: u16) -> usize {
        let mut data = [BS_PCODE, address, 0xa4, 0, 0, BS_WRITE_DENCITY, 0];
        bs_conv_u16_to_2byte(&mut data[3..5], dencity);
        let l = data.len();
        data[l - 1] = bs_crc(&data[0..l - 1]);
        // info!("Write dencity {:x}", data);
        buff[0..l].copy_from_slice(&data);
        l
    }
}
