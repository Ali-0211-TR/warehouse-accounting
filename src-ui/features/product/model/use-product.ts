import type { ProductEntity } from "@/entities/product";
import { useProductStore } from "@/entities/product";
import { emptyProductEntity } from "@/entities/product/model/schemas";
import { PriceDTO } from "@/shared/bindings/PriceDTO";
import type { PriceEntity } from "@/shared/bindings/PriceEntity";
import { ProductInputDTO } from "@/shared/bindings/dtos/ProductInputDTO";
import { useToast } from "@/shared/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useProductFilters } from "./use-product-filters";

export function useProduct() {
  const [selectedProduct, setSelectedProduct] = useState<ProductEntity | null>(
    null
  );
  const [formVisible, setFormVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [priceListVisible, setPriceListVisible] = useState(false);

  const { t } = useTranslation();

  const products = useProductStore((s) => s.products);
  const loading = useProductStore((s) => s.loading);
  const loadProducts = useProductStore((s) => s.loadProducts);
  const deleteProduct = useProductStore((s) => s.deleteProduct);
  const restoreProduct = useProductStore((s) => s.restoreProduct);
  const calculateBalance = useProductStore((s) => s.calculateBalance);
  const calculateAllBalances = useProductStore((s) => s.calculateAllBalances);
  const saveProduct = useProductStore((s) => s.saveProduct);
  const savePrice = useProductStore((s) => s.savePrice);
  const loadPrices = useProductStore((s) => s.loadPrices);
  const deletePrice = useProductStore((s) => s.deletePrice);

  const {
    filters,
    filteredProducts,
    hasActiveFilters,
    setFilters,
    clearFilters,
  } = useProductFilters(products);

  const { showErrorToast, showSuccessToast, showErrorWithAction } = useToast();

  useEffect(() => {
    loadProducts().catch(showErrorToast);
  }, [loadProducts, showErrorToast]);

  const onAdd = useCallback(async () => {
    const newProductEntity: ProductEntity = {
      ...emptyProductEntity,
      id: null, // Ensure new product has no ID
      name: "",
      short_name: "",
    };
    setSelectedProduct(newProductEntity);
    setFormVisible(true);
  }, []);

  const onEdit = useCallback((product: ProductEntity) => {
    setSelectedProduct(product);
    setFormVisible(true);
  }, []);

  const onDelete = useCallback(
    async (product: ProductEntity) => {
      if (!product.id) return;

      try {
        await deleteProduct(product.id);
        showSuccessToast(t("success.data_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteProduct, showErrorToast, showSuccessToast, t]
  );

  const onSave = useCallback(
    async (savedProduct: ProductInputDTO) => {
      try {
        await saveProduct(savedProduct);
        showSuccessToast(t("success.data_saved"));
        setFormVisible(false);
        setSelectedProduct(null);
      } catch (error: any) {
        const errorMessage = error.message || t("error.failed_to_save_product");

        // Check if this is a unique constraint error for a deleted product
        // Error format: "database_error.Execution Error: error returned from database: (code: 2067) UNIQUE constraint failed: products.bar_code"
        const isUniqueConstraintError =
          errorMessage.includes(
            "UNIQUE constraint failed: products.bar_code"
          ) ||
          errorMessage.includes("UNIQUE constraint failed: products.article");

        if (isUniqueConstraintError && !savedProduct.id) {
          // This is a new product with duplicate bar_code/article of a deleted product
          const isBarCodeError = errorMessage.includes("products.bar_code");
          const field = isBarCodeError ? "bar_code" : "article";
          const fieldValue = isBarCodeError
            ? savedProduct.bar_code
            : savedProduct.article;

          showErrorWithAction(
            t("error.product_exists_deleted", { field, value: fieldValue }),
            t("action.restore"),
            async () => {
              try {
                // Import productApi to search for deleted product
                const { productApi } = await import(
                  "@/entities/product/api/product-api"
                );
                const allProducts = await productApi.getAllProducts();

                // Find the deleted product with matching bar_code or article
                const deletedProduct = allProducts.find(
                  p =>
                    p.deleted_at !== null &&
                    (isBarCodeError
                      ? p.bar_code === fieldValue
                      : p.article === fieldValue)
                );

                if (deletedProduct && deletedProduct.id) {
                  await restoreProduct(deletedProduct.id);
                  showSuccessToast(t("success.product_restored"));
                  setFormVisible(false);
                  setSelectedProduct(null);
                } else {
                  showErrorToast(t("error.deleted_product_not_found"));
                }
              } catch (restoreError: any) {
                showErrorToast(
                  restoreError.message || t("error.failed_to_restore")
                );
              }
            }
          );
        } else {
          showErrorToast(errorMessage);
        }

        // Re-throw the error so EntityForm can handle it and keep the form open
        throw error;
      }
    },
    [
      saveProduct,
      restoreProduct,
      showSuccessToast,
      showErrorToast,
      showErrorWithAction,
      t,
    ]
  );

  const onCancel = useCallback(() => {
    setFormVisible(false);
    setSelectedProduct(null);
  }, []);

  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
    setFormVisible(false);
    setSelectedProduct(null);
  }, []);

  // Price manipulation functions
  const onShowPriceList = useCallback((product: ProductEntity) => {
    setSelectedProduct(product);
    setPriceListVisible(true);
  }, []);

  const onHidePriceList = useCallback(() => {
    setPriceListVisible(false);
    setSelectedProduct(null);
  }, []);

  const onSavePrice = useCallback(
    async (price: PriceDTO) => {
      try {
        const savedPrice = await savePrice(price);
        showSuccessToast(t("success.prices_saved"));

        // Refresh products to get updated data
        await loadProducts();

        return savedPrice; // Return the saved price with real ID
      } catch (error: any) {
        showErrorToast(error.message || t("error.failed_to_save_prices"));
        throw error;
      }
    },
    [savePrice, loadProducts, showSuccessToast, showErrorToast, t]
  );

  const onLoadPrices = useCallback(
    async (productId: string): Promise<PriceEntity[]> => {
      try {
        return await loadPrices(productId);
      } catch (error: any) {
        showErrorToast(error.message || t("error.failed_to_load_prices"));
        throw error;
      }
    },
    [loadPrices, showErrorToast, t]
  );

  const onDeletePrice = useCallback(
    async (price: PriceEntity) => {
      try {
        await deletePrice(price);
        showSuccessToast(t("success.price_deleted"));

        // Refresh products to get updated data
        await loadProducts();
      } catch (error: any) {
        showErrorToast(error.message || t("error.failed_to_delete_price"));
        throw error;
      }
    },
    [deletePrice, loadProducts, showSuccessToast, showErrorToast, t]
  );

  return {
    // Existing properties
    products: filteredProducts,
    allProducts: products,
    selectedProduct,
    loading,
    formVisible,
    filtersVisible,
    filters,
    hasActiveFilters,

    // Existing product functions
    onAdd,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    onShowFilters,
    onHideFilters,
    setFilters,
    clearFilters,
    calculateBalance,
    calculateAllBalances,
    reload: loadProducts,

    // New price manipulation properties and functions
    priceListVisible,
    onShowPriceList,
    onHidePriceList,

    onLoadPrices,
    onDeletePrice,
    onSavePrice,
  };
}
