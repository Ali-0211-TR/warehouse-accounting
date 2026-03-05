import type { TaxEntity } from "@/entities/tax";
import { emptyTaxEntity, useTaxStore } from "@/entities/tax";
import { TaxDTO } from "@/shared/bindings/TaxDTO";
import { useToast } from "@/shared/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTaxFilters } from "./use-tax-filters";

export function useTax() {
  const [selectedTax, setSelectedTax] = useState<TaxEntity | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { t } = useTranslation();

  const { taxes, loading, loadTaxes, saveTax, deleteTax } = useTaxStore();

  const { filters, filteredTaxes, hasActiveFilters, setFilters, clearFilters } =
    useTaxFilters(taxes);

  const { showErrorToast, showSuccessToast } = useToast();

  useEffect(() => {
    loadTaxes().catch(showErrorToast);
  }, [loadTaxes, showErrorToast]);

  const onAdd = useCallback(() => {
    setSelectedTax(emptyTaxEntity);
    setFormVisible(true);
  }, []);

  const onEdit = useCallback((tax: TaxEntity) => {
    setSelectedTax(tax);
    setFormVisible(true);
  }, []);

  const onDelete = useCallback(
    async (tax: TaxEntity) => {
      if (!tax.id) return;

      try {
        await deleteTax(tax.id);
        showSuccessToast(t("success.data_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteTax, showErrorToast, showSuccessToast, t]
  );

  const onSave = useCallback(
    async (taxDto: TaxDTO) => {
      try {
        await saveTax(taxDto);

        showSuccessToast(
          taxDto.id ? t("success.data_updated") : t("success.data_created")
        );
        setFormVisible(false);
        setSelectedTax(null);
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [saveTax, showErrorToast, showSuccessToast, t]
  );

  const onCancel = useCallback(() => {
    setFormVisible(false);
    setSelectedTax(null);
  }, []);

  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
    setFormVisible(false);
    setSelectedTax(null);
  }, []);

  const handleSetFilters = useCallback(
    (newFilters: any) => {
      setFilters(newFilters);
      setFormVisible(false);
      setSelectedTax(null);
    },
    [setFilters]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setFormVisible(false);
    setSelectedTax(null);
  }, [clearFilters]);

  return {
    taxes: filteredTaxes,
    allTaxes: taxes,
    selectedTax,
    loading,
    formVisible,
    filtersVisible,
    filters,
    hasActiveFilters,
    onAdd,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    onShowFilters,
    onHideFilters,
    setFilters: handleSetFilters,
    clearFilters: handleClearFilters,
    reload: loadTaxes,
  };
}
