use std::{fmt, str::FromStr};

use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::impl_enum;

pub const BS_NOZZLE_BIT: u8 = 0b10000000;
pub const BS_PAUSE_BIT: u8 = 0b01000000;
pub const BS_START_BIT: u8 = 0b00100000;
pub const BS_CARD_BIT: u8 = 0b00010000;
pub const BS_KB_CONTROL_BIT: u8 = 0b00001000;
pub const BS_KB_PRESET_BIT: u8 = 0b00000010;
pub const BS_ERROR_BIT: u8 = 0b00000001;

impl_enum!(RoleType, Administrator, Manager, Seller, Operator, Remote);
impl_enum!(CameraType, Blocked, Local, NetworkJpeg, NetworkMjpeg);
impl_enum!(CardState, Ready, Pour, Blocked);
impl_enum!(DiscountType, Price, Card);
impl_enum!(DiscountBoundType, Money, Volume);
impl_enum!(PriceType, Sale, Income, Outcome);
impl_enum!(DiscountUnitType, Percent, MoneySum, MoneyPrice, Count);
impl_enum!(OrderType, Income, Outcome, Sale, SaleDispenser, Returns);

impl OrderType {
    pub fn get_sign(&self) -> i32 {
        match self {
            OrderType::Income => 1,
            OrderType::Outcome => -1,
            OrderType::Sale => -1,
            OrderType::SaleDispenser => -1,
            OrderType::Returns => 1,
        }
    }
}

impl_enum!(ProductType, FuelLiquid, FuelGaseous, Service, Product);
impl_enum!(TankProtocolType, TexnoUz, Arrow);
impl_enum!(PresetType, Volume, Amount);
impl_enum!(FuelingType, Regular, NoCache, Kalibr, Progon);
impl_enum!(DispenserState, Active, Blocked, Inactive);

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared//bindings/")
)]
pub enum SortOrder {
    Asc,
    Desc,
}

// impl_enum!(
//     ShopType,
//     All,
//     FiscalRegistrar,
//     BankingTerminal,
//     FuelCardTerminal
// );
// impl_enum!(ShopProtocol, ProtocolShop, ProtocolTmp);
impl_enum!(
    PaymentType,
    Unknown,
    Cash,
    CashlessCard,
    CashlessContract,
    CashlessTicket,
    CashlessIdCard,
    CashlessBonus,
    CashlessFuel,
    CashlessYandex
);

impl_enum!(
    ClientType,
    Juridical,
    Physical,
    Postpayment,
    Prepayment,
    Seller
);

// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub enum DiscountTypeType {
//     Percent,
//     Money,
//     Count,
//     MoneySum,
//     MoneyPrice,
// }

// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub enum DispenserType {
//     FuelLiquid,
//     FuelGaseous,
//     Balloon,
// }

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Eq, Default)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum LimitType {
    #[default]
    Unlimited,
    LimitVolume,
    LimitSumm,
}

impl FromStr for LimitType {
    type Err = &'static str;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Unlimited" => Ok(LimitType::Unlimited),
            "LimitVolume" => Ok(LimitType::LimitVolume),
            "LimitSumm" => Ok(LimitType::LimitSumm),
            _ => Err("Invalid LimitType string"),
        }
    }
}

impl fmt::Display for LimitType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let display_str = match self {
            LimitType::Unlimited => "Unlimited",
            LimitType::LimitVolume => "LimitVolume",
            LimitType::LimitSumm => "LimitSumm",
        };
        write!(f, "{}", display_str)
    }
}

// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub enum PeriodType {
//     HolidayNo,
//     HolidayYes,
// }

// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub enum ProductTypeType {
//     All,
//     Fuel,
//     Service,
//     Product,
// }

impl_enum!(GroupType, No, Client, Product, Idcard);

// #[derive(Hash)]
// impl_enum!(DispenserProtocolType, BlueSky, TexnoUz, Shelf);

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Eq, Hash, Default)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum DispenserProtocolType {
    #[default]
    BlueSky,
    TexnoUz,
    Shelf,
}

impl FromStr for DispenserProtocolType {
    type Err = &'static str;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "BlueSky" => Ok(DispenserProtocolType::BlueSky),
            "TexnoUz" => Ok(DispenserProtocolType::TexnoUz),
            "Shelf" => Ok(DispenserProtocolType::Shelf),
            _ => Err("Invalid DispenserProtocolType string"),
        }
    }
}

impl fmt::Display for DispenserProtocolType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let display_str = match self {
            DispenserProtocolType::BlueSky => "BlueSky",
            DispenserProtocolType::TexnoUz => "TexnoUz",
            DispenserProtocolType::Shelf => "Shelf",
        };
        write!(f, "{}", display_str)
    }
}

// #[allow(dead_code)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub enum BankProtocolType {
//     ProtocolBank,
// }

// // pub enum DeviceProtocolType {
// //     TexnoUz,
// // }

// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub enum FuelProtocolType {
//     ProtocolFuel,
// }

// pub enum StateType {
//     Blocked,
//     Ready,
// }

// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub enum TaxType {
//     Nested,
//     Imposed,
//     ImposedSubtract,
// }

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum RequestCmd {
    WritePrice(u32),
    ReadPrice,
    WriteSolenoid(u8),
    ReadSolenoid,
    WriteDencity(u16),
    ReadDencity,
    ReadPressure,
    ReadFlow,
    PresetAmount(u32, u32),
    PresetVolume(u32, u32),
    ReadFueling,
    GetStatus,
    ReadTotal,
    ReadShiftTotal,
    StartFueling,
    StopFueling,
    AskControl,
    ReturnControl,
    ClearShiftTotal,
    PauseFueling,
    ResumeFueling,
    SelectNextNozzle(u8),
    ReadPreset,
    ReadCardId,
    ReadErrorCode,
    ReadId,
    ResetKbPresetFlag,
    ResetErrorFlag,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum CommRequest {
    Cmd(u8, RequestCmd),
    Stop,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Eq, PartialEq, Serialize, Debug, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum CommResponse {
    Sh(u8, ShResp),
    BS(u8, BsResp),
}

impl fmt::Display for CommResponse {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            CommResponse::Sh(code, resp) => write!(f, "Sh({}): {}", code, resp),
            CommResponse::BS(code, resp) => write!(f, "BS({}): {}", code, resp),
        }
    }
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Eq, PartialEq, Serialize, Debug, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum ShResp {
    CommandOk(),
    CommandBad(),
    StopStatus(ActDispState),
    ActiveKeyboard(FuelingType, ActDispState, u32),
    ActiveKeyboardRequest(FuelingType, ActDispState, u32),
    ActiveModeActiveGun(ActDispState, FuelingType, u8, u32),
    ActiveModeNoActiveGun(ActDispState, FuelingType, u8, u32),
    ReadPrice(u16),
    CurrentAmount(ActDispState, FuelingType, u8, u32),
    MadeAmountResponse(ActDispState, u32, u32, u16),
    ReadVolumeOfChange(u32),
    ReadVolumeOfNonCache(u32),
    CacheMoneyOfChange(u32),
    PassageVolumeOfChange(u32),
    TotalCounter(u32),
    Dencity(u32),
    Pressure(u32),
}

impl fmt::Display for ShResp {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ShResp::CommandOk() => write!(f, "CommandOk"),
            ShResp::CommandBad() => write!(f, "CommandBad"),
            ShResp::StopStatus(state) => write!(f, "StopStatus({})", state),
            ShResp::ActiveKeyboard(ft, state, num) => {
                write!(f, "ActiveKeyboard({:?}, {}, {})", ft, state, num)
            }
            ShResp::ActiveKeyboardRequest(ft, state, num) => {
                write!(f, "ActiveKeyboardRequest({:?}, {}, {})", ft, state, num)
            }
            ShResp::ActiveModeActiveGun(state, ft, num, val) => write!(
                f,
                "ActiveModeActiveGun({}, {:?}, {}, {})",
                state, ft, num, val
            ),
            ShResp::ActiveModeNoActiveGun(state, ft, num, val) => write!(
                f,
                "ActiveModeNoActiveGun({}, {:?}, {}, {})",
                state, ft, num, val
            ),
            ShResp::ReadPrice(price) => write!(f, "ReadPrice({})", price),
            ShResp::CurrentAmount(state, ft, num, val) => {
                write!(f, "CurrentAmount({}, {:?}, {}, {})", state, ft, num, val)
            }
            ShResp::MadeAmountResponse(state, val1, val2, val3) => write!(
                f,
                "MadeAmountResponse({}, {}, {}, {})",
                state, val1, val2, val3
            ),
            ShResp::ReadVolumeOfChange(val) => write!(f, "ReadVolumeOfChange({})", val),
            ShResp::ReadVolumeOfNonCache(val) => write!(f, "ReadVolumeOfNonCache({})", val),
            ShResp::CacheMoneyOfChange(val) => write!(f, "CacheMoneyOfChange({})", val),
            ShResp::PassageVolumeOfChange(val) => write!(f, "PassageVolumeOfChange({})", val),
            ShResp::TotalCounter(val) => write!(f, "TotalCounter({})", val),
            ShResp::Dencity(val) => write!(f, "Dencity({})", val),
            ShResp::Pressure(val) => write!(f, "Pressure({})", val),
        }
    }
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Eq, PartialEq, Serialize, Debug, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum BsResp {
    WriteUnitPrice(bool),
    ReadUnitPrice(u32),
    WriteSolenoid(bool),
    ReadSolenoid(u16),
    WriteDencity(bool),
    ReadDencity(u16),
    WriteAmountPreset,
    WriteVolumePreset,
    ReadPressure(u16),
    ReadFlow(u16),
    DispenserState(DispenserFuelingState),
    ClearShiftTotal,
    ReadFuelingData(u32, u32),
    ReadTotal(u64, u64),
    ReadShiftTotal(u64, u64),
    StartFueling(bool),
    StopFueling,
    AskForControl,
    ReturnControl,
    PauseFueling,
    ResumeFueling,
    NextNozzleSelected,
    ReadKBPreset(PresetType, u32),
    ReadCardId(u32),
    ReadErrorCode(u8),
    ReadId(u32),
    ResetKbPresetFlag,
    ResetErrorFlag,
}

impl fmt::Display for BsResp {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            BsResp::WriteUnitPrice(val) => write!(f, "WriteUnitPrice({})", val),
            BsResp::ReadUnitPrice(val) => write!(f, "ReadUnitPrice({})", val),
            BsResp::WriteSolenoid(val) => write!(f, "WriteSolenoid({})", val),
            BsResp::ReadSolenoid(val) => write!(f, "ReadSolenoid({})", val),
            BsResp::WriteDencity(val) => write!(f, "WriteDencity({})", val),
            BsResp::ReadDencity(val) => write!(f, "ReadDencity({})", val),
            BsResp::WriteAmountPreset => write!(f, "WriteAmountPreset"),
            BsResp::WriteVolumePreset => write!(f, "WriteVolumePreset"),
            BsResp::ReadPressure(val) => write!(f, "ReadPressure({})", val),
            BsResp::ReadFlow(val) => write!(f, "ReadFlow({})", val),
            BsResp::DispenserState(state) => write!(f, "DispenserState({})", state),
            BsResp::ClearShiftTotal => write!(f, "ClearShiftTotal"),
            BsResp::ReadFuelingData(val1, val2) => write!(f, "ReadFuelingData({}, {})", val1, val2),
            BsResp::ReadTotal(val1, val2) => write!(f, "ReadTotal({}, {})", val1, val2),
            BsResp::ReadShiftTotal(val1, val2) => write!(f, "ReadShiftTotal({}, {})", val1, val2),
            BsResp::StartFueling(val) => write!(f, "StartFueling({})", val),
            BsResp::StopFueling => write!(f, "StopFueling"),
            BsResp::AskForControl => write!(f, "AskForControl"),
            BsResp::ReturnControl => write!(f, "ReturnControl"),
            BsResp::PauseFueling => write!(f, "PauseFueling"),
            BsResp::ResumeFueling => write!(f, "ResumeFueling"),
            BsResp::NextNozzleSelected => write!(f, "NextNozzleSelected"),
            BsResp::ReadKBPreset(pt, val) => write!(f, "ReadKBPreset({:?}, {})", pt, val),
            BsResp::ReadCardId(val) => write!(f, "ReadCardId({})", val),
            BsResp::ReadErrorCode(val) => write!(f, "ReadErrorCode({})", val),
            BsResp::ReadId(val) => write!(f, "ReadId({})", val),
            BsResp::ResetKbPresetFlag => write!(f, "ResetKbPresetFlag"),
            BsResp::ResetErrorFlag => write!(f, "ResetErrorFlag"),
        }
    }
}

impl BsResp {
    pub fn get_state(b: u8) -> Self {
        Self::DispenserState(DispenserFuelingState::get_state(b))
    }
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Eq, Deserialize, Serialize, PartialEq, Debug, Clone, Copy, Default)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct DispenserFuelingState {
    pub nozzle_down: bool,
    pub pause: bool,
    pub start: bool,
    pub card: bool,
    pub kb_control: bool,
    pub kb_preset: bool,
    pub is_error: bool,
}

impl fmt::Display for DispenserFuelingState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "DispenserFuelingState {{ nozzle_down: {}, pause: {}, start: {}, card: {}, kb_control: {}, kb_preset: {}, is_error: {} }}",
            self.nozzle_down,
            self.pause,
            self.start,
            self.card,
            self.kb_control,
            self.kb_preset,
            self.is_error
        )
    }
}

impl DispenserFuelingState {
    // pub fn new() -> DispenserFuelingState {
    //     DispenserFuelingState {
    //         nozzle_down: true,
    //         pause: false,
    //         start: false,
    //         card: false,
    //         kb_control: false,
    //         kb_preset: false,
    //         is_error: false,
    //     }
    // }

    pub fn get_state(b: u8) -> Self {
        DispenserFuelingState {
            nozzle_down: (b & BS_NOZZLE_BIT) > 0,
            pause: (b & BS_PAUSE_BIT) > 0,
            start: (b & BS_START_BIT) > 0,
            card: (b & BS_CARD_BIT) > 0,
            kb_control: (b & BS_KB_CONTROL_BIT) > 0,
            kb_preset: (b & BS_KB_PRESET_BIT) > 0,
            is_error: (b & BS_ERROR_BIT) > 0,
        }
    }
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Eq, Deserialize, Serialize, PartialEq, Debug, Clone, Copy)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct ActDispState {
    pub pist: u8,
    pub is_start: bool,
    pub hvalve: bool,
    pub lvalve: bool,
    pub is_motor: bool,
    pub is_pause: bool,
    pub is_keyboard: bool,
    pub is_fueling: bool,
}

impl fmt::Display for ActDispState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "ActDispState {{ pist: {}, is_start: {}, hvalve: {}, lvalve: {}, is_motor: {}, is_pause: {}, is_keyboard: {}, is_fueling: {} }}",
            self.pist,
            self.is_start,
            self.hvalve,
            self.lvalve,
            self.is_motor,
            self.is_pause,
            self.is_keyboard,
            self.is_fueling
        )
    }
}

impl ActDispState {
    // pub fn new() -> ActDispState {
    //     ActDispState {
    //         pist: 0,
    //         is_start: false,
    //         hvalve: false,
    //         lvalve: false,
    //         is_motor: false,
    //         is_pause: false,
    //         is_keyboard: false,
    //         is_fueling: false,
    //     }
    // }
    pub fn new_from_sh_bytes(pist_st: u8, st: u8) -> ActDispState {
        let pis: u8 = if pist_st & 0b00100000 > 0 {
            5
        } else if pist_st & 0b00010000 > 0 {
            4
        } else if pist_st & 0b00001000 > 0 {
            3
        } else if pist_st & 0b00000100 > 0 {
            2
        } else if pist_st & 0b00000010 > 0 {
            1
        } else {
            0
        };
        ActDispState {
            pist: pis, //st & 0b10000000,
            hvalve: (st & 0b00000010) > 0,
            lvalve: (st & 0b00000100) > 0,
            is_motor: (st & 0b00001000) > 0,
            is_pause: (st & 0b00010000) > 0,
            is_start: (st & 0b00100000) == 0,
            is_keyboard: (st & 0b01000000) > 0,
            is_fueling: (st & 0b10000000) > 0,
        }
    }
}

impl FuelingType {
    pub fn from_sh(ft: u8) -> Self {
        if (ft & 0b00000001) > 0 || (ft & 0b00000010) > 0 {
            FuelingType::Regular
        } else if (ft & 0b00000100) > 0 {
            FuelingType::NoCache
        } else if (ft & 0b00001000) > 0 {
            FuelingType::Kalibr
        } else {
            FuelingType::Progon
        }
    }
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
#[repr(u8)]
pub enum DispenserError {
    E01Sensor = 1,
    E02NoOilFotAs,
    E03NoOilFotDf,
    E04SensorSpeedOverflow,
    E05TotVolOver,
    E06TotAmountOver,
    E07MechTotalizer,
    E08BatteryVoltage,
    E09InductiveSensorIsNotWorking,
    E10IdCardProblem,
    E11IllegalPreset,
    E12SingleRefuAmountToMax,
    E13SingleRefuVolToMax,
    E14AnotherGunIsRefueling,
    E15AnotherKbSetParams,
    E16NumbOfRefTimesOver,
    E17DispLocketInpPsw,
    E18PulserSettingsLocked,
    E19CashSystemIsLocked,
    E20FramError,
    E21FlashError,
    E22OverflowRate,
    E23OverFlow,
    E24OilCodeDoesNotMatch,
    E25IcCardAbnormality,
    E26CommunicationError,
    E27NowOffDuty,
    E28CommunicationUnderControlMode,
    E29DispLockDueTime,
    E30DispLockDueStageTime,
    E31DispLockDueVolumeOrAmount,
    E32GunUpEnterMenu,
}
/// Custom trait for fallible conversion from u8 to DispenserError
impl TryFrom<u8> for DispenserError {
    type Error = crate::shared::error::Error;

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        use DispenserError::*;
        match value {
            1 => Ok(E01Sensor),
            2 => Ok(E02NoOilFotAs),
            3 => Ok(E03NoOilFotDf),
            4 => Ok(E04SensorSpeedOverflow),
            5 => Ok(E05TotVolOver),
            6 => Ok(E06TotAmountOver),
            7 => Ok(E07MechTotalizer),
            8 => Ok(E08BatteryVoltage),
            9 => Ok(E09InductiveSensorIsNotWorking),
            10 => Ok(E10IdCardProblem),
            11 => Ok(E11IllegalPreset),
            12 => Ok(E12SingleRefuAmountToMax),
            13 => Ok(E13SingleRefuVolToMax),
            14 => Ok(E14AnotherGunIsRefueling),
            15 => Ok(E15AnotherKbSetParams),
            16 => Ok(E16NumbOfRefTimesOver),
            17 => Ok(E17DispLocketInpPsw),
            18 => Ok(E18PulserSettingsLocked),
            19 => Ok(E19CashSystemIsLocked),
            20 => Ok(E20FramError),
            21 => Ok(E21FlashError),
            22 => Ok(E22OverflowRate),
            23 => Ok(E23OverFlow),
            24 => Ok(E24OilCodeDoesNotMatch),
            25 => Ok(E25IcCardAbnormality),
            26 => Ok(E26CommunicationError),
            27 => Ok(E27NowOffDuty),
            28 => Ok(E28CommunicationUnderControlMode),
            29 => Ok(E29DispLockDueTime),
            30 => Ok(E30DispLockDueStageTime),
            31 => Ok(E31DispLockDueVolumeOrAmount),
            32 => Ok(E32GunUpEnterMenu),
            _ => Err(crate::shared::error::Error::Dispenser(
                "Invalid error code".to_owned(),
            )),
        }
    }
}
