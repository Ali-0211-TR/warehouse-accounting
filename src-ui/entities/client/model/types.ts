import type { ClientEntity as ClientEntityBinding } from "@/shared/bindings/ClientEntity";
import type { ClientDTO } from "@/shared/bindings/ClientDTO";
import type { ClientType } from "@/shared/bindings/ClientType";
import type { ClientFilter } from "@/shared/bindings/ClientFilter";
import type { ClientColumn } from "@/shared/bindings/ClientColumn";

export type ClientEntity = ClientEntityBinding;

// Frontend filter state (what the UI uses)
export interface ClientFilterState {
  search: string;
  client_type?: ClientType;
  has_tax_code?: boolean;
}

// Backend filter structure (matches Rust ClientFilter exactly)
export type ClientLazyFilters = ClientFilter;

// Sort field type (matches Rust ClientColumn exactly)
export type ClientSortField = ClientColumn;

export { ClientDTO, ClientType, ClientFilter, ClientColumn };
