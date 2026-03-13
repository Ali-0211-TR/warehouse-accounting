use std::{fmt, str::FromStr};

use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::impl_enum;

impl_enum!(RoleType, Administrator, Manager, Seller, Operator, Remote);
impl_enum!(DiscountType, Price, Percentage);
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

// Remaining commented-out types removed during cleanup
