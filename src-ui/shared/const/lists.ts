import { t } from "i18next";


export interface SelectOption {
  id: string;
  label: string;
  value: string;
}

// export const getProductTypeOptions = (): SelectOption[] => [
//     {
//         id: 'Product',
//         label: t('lists.product_type.Product'),
//         value: 'Product'
//     },
//     {
//         id: 'Service',
//         label: t('lists.product_type.Service'),
//         value: 'Service'
//     },
//     {
//         id: 'FuelLiquid',
//         label: t('lists.product_type.FuelLiquid'),
//         value: 'FuelLiquid'
//     },
//     {
//         id: 'FuelGaseous',
//         label: t('lists.product_type.FuelGaseous'),
//         value: 'FuelGaseous'
//     }
// ]



export const getGroupTypeOptions = () => [
  { label: t("lists.group_type.No"), id: "No" },
  { label: t("lists.group_type.Client"), id: "Client" },
  { label: t("lists.group_type.Product"), id: "Product" },
  { label: t("lists.group_type.Idcard"), id: "Idcard" },
];

export const getProductTypeOptions = () => [
  { label: t("lists.product_type.Service"), id: "Service" },
  { label: t("lists.product_type.Product"), id: "Product" },
];

export const getClientTypeOptions = () => [
  { label: t("lists.client_type.Juridical"), id: "Juridical" },
  { label: t("lists.client_type.Physical"), id: "Physical" },
  { label: t("lists.client_type.Postpayment"), id: "Postpayment" },
  { label: t("lists.client_type.Prepayment"), id: "Prepayment" },
  { label: t("lists.client_type.Seller"), id: "Seller" },
];
//------Discount Type Options--------

export const getDiscountTypeOptions = () => [
  { label: t("lists.discount_type.Price"), id: "Price" },
  { label: t("lists.discount_type.Card"), id: "Card" },
];

export const getDiscountTypeTypeOptions = () => [
  { label: t("lists.discount_type_type.Percent"), id: "Percent" },
  { label: t("lists.discount_type_type.Money"), id: "Money" },
  { label: t("lists.discount_type_type.Count"), id: "Count" },
  { label: t("lists.discount_type_type.MoneySum"), id: "MoneySum" },
  { label: t("lists.discount_type_type.MoneyPrice"), id: "MoneyPrice" },
];

export const getDiscountBoundTypeOptions = () => [
  { label: t("lists.discount_bound_type.Money"), id: "Money" },
  { label: t("lists.discount_bound_type.Volume"), id: "Volume" },
];

export const getRoleTypeOptions = () => [
  { label: t("lists.role_type.Administrator"), id: "Administrator" },
  { label: t("lists.role_type.Manager"), id: "Manager" },
  { label: t("lists.role_type.Seller"), id: "Seller" },
  { label: t("lists.role_type.Operator"), id: "Operator" },
  { label: t("lists.role_type.Remote"), id: "Remote" },
];

export const getShopTypeOptions = () => [
  { label: t("lists.shop_type.All"), id: "All" },
  { label: t("lists.shop_type.FiscalRegistrar"), id: "FiscalRegistrar" },
  { label: t("lists.shop_type.BankingTerminal"), id: "BankingTerminal" },
  { label: t("lists.shop_type.FuelCardTerminal"), id: "FuelCardTerminal" },
];

export const getShopProtocolOptions = () => [
  { label: t("lists.shop_protocol.ProtocolShop"), id: "ProtocolShop" },
  { label: t("lists.shop_protocol.ProtocolTmp"), id: "ProtocolTmp" },
];

export const getOrderTypeOptions = () => [
  { label: t("lists.order_type.Income"), id: "Income" },
  { label: t("lists.order_type.Outcome"), id: "Outcome" },
  { label: t("lists.order_type.Sale"), id: "Sale" },
  { label: t("lists.order_type.Returns"), id: "Returns" },
];

export const getFuelingTypeOptions = () => [
  { label: t("lists.fueling_type.Regular"), id: "Regular" },
  { label: t("lists.fueling_type.NoCache"), id: "NoCache" },
  { label: t("lists.fueling_type.Kalibr"), id: "Kalibr" },
  { label: t("lists.fueling_type.Progon"), id: "Progon" },
];

export const getPresetTypeOptions = () => [
  { label: t("lists.preset_type.Volume"), id: "Volume" },
  { label: t("lists.preset_type.Amount"), id: "Amount" },
];

export const serialPortSpeeds: number[] = [
  4800, 9600, 19200, 38400, 57600, 74880, 115200,
];
