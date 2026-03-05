import type { ProductInputDTO } from "@/shared/bindings/dtos/ProductInputDTO";
import type { ProductEntity as ProductEntityBinding } from "@/shared/bindings/ProductEntity";
import type { ProductType } from "@/shared/bindings/ProductType";
export type ProductEntity = ProductEntityBinding;
export type ProductDTO = ProductInputDTO;
export type { ProductType };

export interface ProductFilterState {
  search: string;
  product_type?: ProductType;
  group_id?: string;
  unit_id?: string;
  has_balance?: boolean;
  price_range?: {
    min?: number;
    max?: number;
  };
}

export interface ProductPaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
