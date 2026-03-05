import { useCallback, useEffect, useRef, useState } from "react";
import { productApi } from "@/entities/product/api/product-api";
import type { ProductEntity } from "@/entities/product/model/types";
import type { PaginatorDTO } from "@/shared/bindings/dtos/PaginatorDTO";
import type { ProductFilter } from "@/shared/bindings/dtos/ProductFilter";
import type { ProductColumn } from "@/shared/bindings/dtos/ProductColumn";
import type { LazyTableStateDTO } from "@/shared/bindings/dtos/LazyTableStateDTO";
import type { SortOrder } from "@/shared/bindings/SortOrder";
import type { PaginationInfo } from "@/shared/const/realworld.types";
import { defaultPagination } from "@/shared/const/realworld.types";

const DEFAULT_PAGE_SIZE = 20;

const emptyFilter: ProductFilter = {
  search: null,
  productType: null,
  groupId: null,
  activeDateFrom: null,
  activeDateTo: null,
};

const defaultQuery: LazyTableStateDTO<ProductFilter, ProductColumn> = {
  first: 0,
  rows: DEFAULT_PAGE_SIZE,
  page: 1,
  sort_field: "Article",
  sort_order: "Desc",
  filters: emptyFilter,
};

export function useProductPaginated() {
  const [products, setProducts] = useState<ProductEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>(defaultPagination);
  const [query, setQuery] = useState(defaultQuery);

  const queryRef = useRef(query);
  queryRef.current = query;

  const fetchProducts = useCallback(
    async (q: LazyTableStateDTO<ProductFilter, ProductColumn>) => {
      setLoading(true);
      try {
        const result: PaginatorDTO<ProductEntity> =
          await productApi.getProductsPaginated(q);
        setProducts(result.items);
        setPagination({
          page: result.page,
          pageCount: result.pageCount,
          count: result.count,
          limit: result.limit,
        });
      } catch (e) {
        console.error("Failed to load paginated products:", e);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    fetchProducts(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = useCallback(() => {
    fetchProducts(queryRef.current);
  }, [fetchProducts]);

  const pageChange = useCallback(
    (page: number) => {
      const newQuery = { ...queryRef.current, page, first: (page - 1) * queryRef.current.rows };
      setQuery(newQuery);
      fetchProducts(newQuery);
    },
    [fetchProducts],
  );

  const onSort = useCallback(
    (field: ProductColumn, order: SortOrder) => {
      const newQuery = { ...queryRef.current, sort_field: field, sort_order: order, page: 1, first: 0 };
      setQuery(newQuery);
      fetchProducts(newQuery);
    },
    [fetchProducts],
  );

  const setSearch = useCallback(
    (search: string) => {
      const newFilters: ProductFilter = {
        ...queryRef.current.filters,
        search: search.trim() || null,
      };
      const newQuery = { ...queryRef.current, filters: newFilters, page: 1, first: 0 };
      setQuery(newQuery);
      fetchProducts(newQuery);
    },
    [fetchProducts],
  );

  const setActiveInPeriod = useCallback(
    (dateFrom: string | null, dateTo: string | null) => {
      const newFilters: ProductFilter = {
        ...queryRef.current.filters,
        activeDateFrom: dateFrom,
        activeDateTo: dateTo,
      };
      const newQuery = { ...queryRef.current, filters: newFilters, page: 1, first: 0 };
      setQuery(newQuery);
      fetchProducts(newQuery);
    },
    [fetchProducts],
  );

  const setProductTypeFilter = useCallback(
    (productType: ProductFilter["productType"]) => {
      const newFilters: ProductFilter = {
        ...queryRef.current.filters,
        productType,
      };
      const newQuery = { ...queryRef.current, filters: newFilters, page: 1, first: 0 };
      setQuery(newQuery);
      fetchProducts(newQuery);
    },
    [fetchProducts],
  );

  const setGroupFilter = useCallback(
    (groupId: string | null) => {
      const newFilters: ProductFilter = {
        ...queryRef.current.filters,
        groupId,
      };
      const newQuery = { ...queryRef.current, filters: newFilters, page: 1, first: 0 };
      setQuery(newQuery);
      fetchProducts(newQuery);
    },
    [fetchProducts],
  );

  const clearAllFilters = useCallback(() => {
    const newQuery = { ...queryRef.current, filters: emptyFilter, page: 1, first: 0 };
    setQuery(newQuery);
    fetchProducts(newQuery);
  }, [fetchProducts]);

  const hasActiveFilters =
    query.filters.search !== null ||
    query.filters.productType !== null ||
    query.filters.groupId !== null ||
    query.filters.activeDateFrom !== null;

  return {
    products,
    loading,
    pagination,
    query,
    hasActiveFilters,

    // Actions
    reload,
    pageChange,
    onSort,
    setSearch,
    setActiveInPeriod,
    setProductTypeFilter,
    setGroupFilter,
    clearAllFilters,
  };
}
