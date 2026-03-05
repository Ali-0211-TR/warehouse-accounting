import type { ProductEntity, ProductFilterState } from "./types";

export const productSelectors = {
  filterProducts: (
    products: ProductEntity[],
    filters: ProductFilterState,
  ): ProductEntity[] => {
    return products.filter((product) => {
      const matchesSearch =
        !filters.search ||
        product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.short_name
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        product.article.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.bar_code.toLowerCase().includes(filters.search.toLowerCase());

      const matchesProductType =
        !filters.product_type || product.product_type === filters.product_type;

      const matchesGroup =
        filters.group_id === undefined ||
        product.group?.id === filters.group_id;

      // const matchesBalanceStatus =
      //   !filters.has_balance ||
      //   (filters.balance_status === "out_of_stock" && product.balance <= 0) ||
      //   (filters.balance_status === "low_stock" &&
      //     product.balance > 0 &&
      //     product.balance < 10) ||
      //   (filters.balance_status === "in_stock" && product.balance >= 10);

      return matchesSearch && matchesProductType && matchesGroup;
    });
  },

  sortProducts: (
    products: ProductEntity[],
    sortBy: keyof ProductEntity = "name",
  ): ProductEntity[] => {
    return [...products].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return aVal - bVal;
      }

      return 0;
    });
  },

  getProductsByType: (
    products: ProductEntity[],
    productType: string,
  ): ProductEntity[] => {
    return products.filter((product) => product.product_type === productType);
  },

  getLowStockProducts: (
    products: ProductEntity[],
    threshold: number = 10,
  ): ProductEntity[] => {
    return products.filter(
      (product) => product.balance <= threshold && product.balance > 0,
    );
  },

  getOutOfStockProducts: (products: ProductEntity[]): ProductEntity[] => {
    return products.filter((product) => product.balance <= 0);
  },
};
