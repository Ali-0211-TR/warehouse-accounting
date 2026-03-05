import type { UnitEntity } from "@/entities/unit";
import { emptyUnitEntity, useUnitStore } from "@/entities/unit";
import { UnitDTO } from "@/shared/bindings/UnitDTO";
import { useToast } from "@/shared/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUnitFilters } from "./use-unit-filters";

export function useUnit() {
  const [selectedUnit, setSelectedUnit] = useState<UnitEntity | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { t } = useTranslation();

  const { units, loading, loadUnits, saveUnit, deleteUnit } = useUnitStore();

  const { filters, filteredUnits, hasActiveFilters, setFilters, clearFilters } =
    useUnitFilters(units);

  const { showErrorToast, showSuccessToast } = useToast();

  useEffect(() => {
    loadUnits().catch(showErrorToast);
  }, [loadUnits, showErrorToast]);

  const onAdd = useCallback(() => {
    setSelectedUnit(emptyUnitEntity);
    setFormVisible(true);
  }, []);

  const onEdit = useCallback((unit: UnitEntity) => {
    setSelectedUnit(unit);
    setFormVisible(true);
  }, []);

  const onDelete = useCallback(
    async (unit: UnitEntity) => {
      if (!unit.id) return;

      try {
        await deleteUnit(unit.id);
        showSuccessToast(t("success.data_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteUnit, showErrorToast, showSuccessToast, t]
  );

  const onSave = useCallback(
    async (unitDto: UnitDTO) => {
      try {
        await saveUnit(unitDto);

        showSuccessToast(
          unitDto.id ? t("success.data_updated") : t("success.data_created")
        );
        setFormVisible(false);
        setSelectedUnit(null);
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [saveUnit, showErrorToast, showSuccessToast, t]
  );

  const onCancel = useCallback(() => {
    setFormVisible(false);
    setSelectedUnit(null);
  }, []);

  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
    setFormVisible(false);
    setSelectedUnit(null);
  }, []);

  const handleSetFilters = useCallback(
    (newFilters: any) => {
      setFilters(newFilters);
      setFormVisible(false);
      setSelectedUnit(null);
    },
    [setFilters]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setFormVisible(false);
    setSelectedUnit(null);
  }, [clearFilters]);

  return {
    units: filteredUnits,
    allUnits: units,
    selectedUnit,
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
    reload: loadUnits,
  };
}
