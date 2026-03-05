import type { ShiftColumn } from "@/shared/bindings/ShiftColumn";
import type { ShiftData as ShiftDataBinding } from "@/shared/bindings/ShiftData";
import type { ShiftEntity as ShiftEntityBinding } from "@/shared/bindings/ShiftEntity";
import type { ShiftFilter } from "@/shared/bindings/ShiftFilter";

export type ShiftEntity = ShiftEntityBinding;
export type ShiftData = ShiftDataBinding;

// Frontend filter state (what the UI uses)
export interface ShiftFilterState {
  search: string;
  user_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  is_open?: boolean;
}

export type ShiftLazyFilters = ShiftFilter;

// Sort field type (matches Rust ShiftColumn exactly)
export type ShiftSortField = ShiftColumn;

export { ShiftColumn, ShiftFilter };
