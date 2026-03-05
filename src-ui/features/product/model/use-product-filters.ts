import { useState, useMemo } from "react";
import { productSelectors } from "@/entities/product";
import type { ProductEntity, ProductFilterState } from "@/entities/product";

export function useProductFilters(products: ProductEntity[]) {
  const [filters, setFilters] = useState<ProductFilterState>({
    search: "",
    product_type: undefined,
    group_id: undefined,
    has_balance: undefined,
  });

  const filteredProducts = useMemo(() => {
    return productSelectors.filterProducts(products, filters);
  }, [products, filters]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== "" ||
      filters.product_type !== undefined ||
      filters.group_id !== undefined ||
      filters.has_balance !== undefined
    );
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      search: "",
      product_type: undefined,
      group_id: undefined,
      has_balance: undefined,
    });
  };

  return {
    filters,
    filteredProducts,
    hasActiveFilters,
    setFilters,
    clearFilters,
  };
}
