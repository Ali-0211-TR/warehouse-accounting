import type { OrderColumn } from "@/shared/bindings/OrderColumn";
import type { OrderEntity as OrderEntityBinding } from "@/shared/bindings/OrderEntity";
import type { OrderFilter } from "@/shared/bindings/OrderFilter";
import type { OrderItemEntity as OrderItemEntityBinding } from "@/shared/bindings/OrderItemEntity";
import type { OrderType } from "@/shared/bindings/OrderType";

export type OrderEntity = OrderEntityBinding;
export type OrderItemEntity = OrderItemEntityBinding;

// Frontend filter state (what the UI uses)
// export interface OrderFilterState {
//   search: string;
//   order_type?: OrderType;
//   client_id?: number;
//   contract_id?: number;
//   date_range?: {
//     start?: string;
//     end?: string;
//   };
//   amount_range?: {
//     min?: number;
//     max?: number;
//   };
//   has_movement?: boolean;
// }

// Backend filter structure (matches Rust OrderFilter exactly)
export type OrderLazyFilters = OrderFilter;

// Sort field type (matches Rust OrderColumn exactly)
export type OrderSortField = OrderColumn;

export { OrderColumn, OrderFilter, OrderType };
