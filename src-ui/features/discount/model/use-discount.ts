import type { DiscountEntity } from "@/entities/discount";
import { emptyDiscount, useDiscountStore } from "@/entities/discount";
import { DiscountDTO } from "@/shared/bindings/DiscountDTO";
import { useToast } from "@/shared/hooks/use-toast";
import { t } from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useDiscountFilters } from "./use-discount-filters";

export function useDiscount() {
  // Form state
  const [selectedDiscount, setSelectedDiscount] =
    useState<DiscountEntity | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Store
  const { discounts, loading, loadDiscounts, saveDiscount, deleteDiscount } =
    useDiscountStore();

  // Filters
  const {
    filters,
    filteredDiscounts,
    hasActiveFilters,
    setFilters,
    clearFilters,
  } = useDiscountFilters(discounts);

  const { showErrorToast, showSuccessToast } = useToast();

  // Load discounts on mount
  useEffect(() => {
    loadDiscounts().catch(showErrorToast);
  }, [loadDiscounts, showErrorToast]);

  // CRUD Actions
  const onAdd = useCallback(() => {
    setSelectedDiscount(emptyDiscount);
    setFormVisible(true);
  }, []);

  const onEdit = useCallback((discount: DiscountEntity) => {
    setSelectedDiscount(discount);
    setFormVisible(true);
  }, []);

  const onDelete = useCallback(
    async (discount: DiscountEntity) => {
      if (!discount.id) return;

      try {
        await deleteDiscount(discount.id);
        showSuccessToast(t("success.data_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteDiscount, showErrorToast, showSuccessToast, t]
  );

  const onSave = useCallback(
    async (discount: DiscountEntity | DiscountDTO) => {
      try {
        // If it's already a DTO, use it directly; otherwise convert
        const discountDto: DiscountDTO =
          "device_id" in discount
            ? {
                id: discount.id,
                name: discount.name,
                discount_type: discount.discount_type,
                discount_bound_type: discount.discount_bound_type,
                discount_unit_type: discount.discount_unit_type,
                product_type: discount.product_type,
                bound: discount.bound,
                value: discount.value,
                order_type: discount.order_type,
              }
            : (discount as DiscountDTO);

        await saveDiscount(discountDto);

        const isUpdate =
          "device_id" in discount ? discount.id : (discount as DiscountDTO).id;
        showSuccessToast(
          isUpdate ? t("success.data_updated") : t("success.data_created")
        );
        setFormVisible(false);
        setSelectedDiscount(null);
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [saveDiscount, showErrorToast, showSuccessToast, t]
  );

  const onCancel = useCallback(() => {
    setFormVisible(false);
    setSelectedDiscount(null);
  }, []);

  // Filter Actions
  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
    // Close form when filters are closed/applied
    setFormVisible(false);
    setSelectedDiscount(null);
  }, []);

  // Enhanced setFilters that closes form when filters change
  const handleSetFilters = useCallback(
    (newFilters: any) => {
      setFilters(newFilters);
      // Close form when filters are applied
      setFormVisible(false);
      setSelectedDiscount(null);
    },
    [setFilters]
  );

  // Enhanced clearFilters that closes form
  const handleClearFilters = useCallback(() => {
    clearFilters();
    // Close form when filters are cleared
    setFormVisible(false);
    setSelectedDiscount(null);
  }, [clearFilters]);

  return {
    // Data
    discounts: filteredDiscounts,
    allDiscounts: discounts,
    selectedDiscount,
    loading,

    // Form state
    formVisible,
    filtersVisible,

    // Filter state
    filters,
    hasActiveFilters,

    // CRUD actions
    onAdd,
    onEdit,
    onDelete,
    onSave,
    onCancel,

    // Filter actions
    onShowFilters,
    onHideFilters,
    setFilters: handleSetFilters,
    clearFilters: handleClearFilters,

    // Utilities
    reload: loadDiscounts,
  };
}
