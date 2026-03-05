import type { DiscountBoundType } from "@/shared/bindings/DiscountBoundType";
import type { DiscountType } from "@/shared/bindings/DiscountType";
import type { DiscountUnitType } from "@/shared/bindings/DiscountUnitType";
import type { DispenserProtocolType } from "@/shared/bindings/DispenserProtocolType";
import type { GroupType } from "@/shared/bindings/GroupType";
import type { OrderType } from "@/shared/bindings/OrderType";
import type { ProductType } from "@/shared/bindings/ProductType";

import { TankProtocolType } from "@/shared/bindings/TankProtocolType";

export const TANK_PROTOCOL_OPTIONS: Array<{
  value: TankProtocolType;
  label: string;
}> = [
  { value: "TexnoUz", label: "Texnouz" },
  { value: "Arrow", label: "Arrow" },
];
// General option arrays that can be reused across components
export const DISCOUNT_TYPE_OPTIONS: Array<{
  value: DiscountType;
  label: string;
}> = [
  { value: "Price", label: "lists.discount_type.Price" },
  { value: "Card", label: "lists.discount_type.Card" },
];

export const DISCOUNT_BOUND_TYPE_OPTIONS: Array<{
  value: DiscountBoundType;
  label: string;
}> = [
  { value: "Money", label: "lists.bound_type.Money" },
  { value: "Volume", label: "lists.bound_type.Volume" },
];

export const DISCOUNT_UNIT_TYPE_OPTIONS: Array<{
  value: DiscountUnitType;
  label: string;
}> = [
  { value: "Percent", label: "lists.unit_type.Percent" },
  { value: "MoneySum", label: "lists.unit_type.MoneySum" },
  { value: "MoneyPrice", label: "lists.unit_type.MoneyPrice" },
  { value: "Count", label: "lists.unit_type.Count" },
];

export const PRODUCT_TYPE_OPTIONS: Array<{
  value: ProductType | null;
  label: string;
}> = [
  { value: null, label: "common.all" },
  { value: "Service", label: "lists.product_type.Service" },
  { value: "Product", label: "lists.product_type.Product" },
];

export const GROUP_TYPE_OPTIONS: Array<{ value: GroupType; label: string }> = [
  { value: "No", label: "lists.group_type.No" },
  { value: "Client", label: "lists.group_type.Client" },
  { value: "Product", label: "lists.group_type.Product" },
];

export const CAMERA_TYPE_OPTIONS = [
  { value: "Blocked", label: "lists.camera_type.Blocked" },
  { value: "Local", label: "lists.camera_type.Local" },
  { value: "NetworkJpeg", label: "lists.camera_type.NetworkJpeg" },
  { value: "NetworkMjpeg", label: "lists.camera_type.NetworkMjpeg" },
] as const;

// export const SHOP_TYPE_OPTIONS: Array<{ value: ShopType; label: string }> = [
//   { value: "All", label: "lists.shop_type.All" },
//   { value: "FiscalRegistrar", label: "lists.shop_type.FiscalRegistrar" },
//   { value: "BankingTerminal", label: "lists.shop_type.BankingTerminal" },
//   { value: "FuelCardTerminal", label: "lists.shop_type.FuelCardTerminal" },
// ] as const;

// export const SHOP_PROTOCOL_OPTIONS: Array<{
//   value: ShopProtocol;
//   label: string;
// }> = [
//   { value: "ProtocolShop", label: "lists.shop_protocol.ProtocolShop" },
//   { value: "ProtocolTmp", label: "lists.shop_protocol.ProtocolTmp" },
// ];

export const DISPENSER_STATE_OPTIONS = [
  { value: "Active", label: "lists.dispenser_state.Active" },
  { value: "Blocked", label: "lists.dispenser_state.Blocked" },
  { value: "Inactive", label: "lists.dispenser_state.Inactive" },
] as const;

export const UNIT_PRESETS = [
  // Volume units
  { value: "liter", name: "Литр", short_name: "л" },
  { value: "milliliter", name: "Миллилитр", short_name: "мл" },
  { value: "gallon", name: "Галлон", short_name: "gal" },

  // Weight units
  { value: "kilogram", name: "Килограмм", short_name: "кг" },
  { value: "gram", name: "Грамм", short_name: "г" },
  { value: "pound", name: "Фунт", short_name: "lb" },

  // Length units
  { value: "meter", name: "Метр", short_name: "м" },
  { value: "centimeter", name: "Сантиметр", short_name: "см" },
  { value: "millimeter", name: "Миллиметр", short_name: "мм" },

  // Count units
  { value: "piece", name: "Штука", short_name: "шт" },
  { value: "package", name: "Упаковка", short_name: "уп" },
  { value: "box", name: "Коробка", short_name: "кор" },
] as const;

export const MARK_PRESETS = [
  // Premium marks
  { value: "shell", name: "Shell", category: "premium" },
  { value: "bp", name: "BP", category: "premium" },
  { value: "total", name: "Total", category: "premium" },
  { value: "mobil", name: "Mobil", category: "premium" },

  // Standard marks
  { value: "ai-92", name: "АИ-92", category: "standard" },
  { value: "ai-95", name: "АИ-95", category: "standard" },
  { value: "ai-98", name: "АИ-98", category: "premium" },
  { value: "diesel", name: "Дизель", category: "standard" },

  // Eco marks
  { value: "euro-5", name: "Евро-5", category: "eco" },
  { value: "euro-6", name: "Евро-6", category: "eco" },
  { value: "bio-diesel", name: "Био-дизель", category: "eco" },

  // VIP marks
  { value: "premium-plus", name: "Премиум+", category: "vip" },
  { value: "racing", name: "Гоночный", category: "vip" },
] as const;

export const DISPENSER_PROTOCOL_OPTIONS: Array<{
  value: DispenserProtocolType;
  label: string;
}> = [
  { value: "BlueSky", label: "BlueSky" },
  { value: "TexnoUz", label: "TexnoUz" },
  { value: "Shelf", label: "Shelf" },
];

export const PORT_SPEED_OPTIONS = [
  { value: 9600, label: "9600" },
  { value: 19200, label: "19200" },
  { value: 38400, label: "38400" },
  { value: 57600, label: "57600" },
  { value: 115200, label: "115200" },
] as const;

export const ORDER_TYPE_OPTIONS: Array<{ value: OrderType; label: string }> = [
  { value: "Income", label: "lists.order_type.Income" },
  { value: "Outcome", label: "lists.order_type.Outcome" },
  { value: "Sale", label: "lists.order_type.Sale" },
  { value: "Returns", label: "lists.order_type.Returns" },
];
