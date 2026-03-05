import type { CardEntity as CardEntityBinding } from "@/shared/bindings/CardEntity";
import type { CardState } from "@/shared/bindings/CardState";

export type CardEntity = CardEntityBinding;

// Frontend filter state (what the UI uses)
export interface CardFilterState {
  search: string;
  client_id?: string;
  state?: CardState;
  date_range?: {
    start: Date;
    end: Date;
  };
}

export { CardState };
