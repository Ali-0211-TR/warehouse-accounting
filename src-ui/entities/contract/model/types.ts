import type { ContractColumn } from "@/shared/bindings/ContractColumn";
import type { ContractDTO } from "@/shared/bindings/ContractDTO";
import type { ContractEntity as ContractEntityBinding } from "@/shared/bindings/ContractEntity";
import type { ContractFilter } from "@/shared/bindings/ContractFilter";

export type ContractEntity = ContractEntityBinding;

// Frontend filter state (what the UI uses)
export interface ContractFilterState {
  search: string;
  client_id?: string;
  date_range?: {
    start?: string;
    end?: string;
  };
}

// Backend filter structure (matches Rust ContractFilter exactly)
export type ContractLazyFilters = ContractFilter;

// Sort field type (matches Rust ContractColumn exactly)
export type ContractSortField = ContractColumn;

export { ContractColumn, ContractDTO, ContractFilter };

// Update your ContractDTO type to be more explicit about the format
export interface ContractFormData {
  id: string | null;
  device_id: string;
  client_id: string | null;
  name: string;
  contract_name: string;
  d_begin: string; // This will be YYYY-MM-DD from DatePicker
  d_end: string; // This will be YYYY-MM-DD from DatePicker
}

export interface ContractBackendDTO {
  id: string | null;
  device_id: string;
  client_id: string | null;
  name: string;
  contract_name: string;
  d_begin: string; // This needs to be ISO DateTime string
  d_end: string; // This needs to be ISO DateTime string
}
