import type { TankEntity } from "@/entities/tank";
import { emptyTankEntity, useTankStore } from "@/entities/tank";
import { TankDTO } from "@/shared/bindings/TankDTO";
import { useToast } from "@/shared/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTankFilters } from "./use-tank-filters";

export function useTank() {
  // Form state
  const [selectedTank, setSelectedTank] = useState<TankEntity | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { t } = useTranslation();

  // Store
  const { tanks, loading, loadTanks, saveTank, deleteTank } = useTankStore();

  // Filters
  const { filters, filteredTanks, hasActiveFilters, setFilters, clearFilters } =
    useTankFilters(tanks);

  const { showErrorToast, showSuccessToast } = useToast();

  // Load tanks on mount
  useEffect(() => {
    loadTanks().catch(showErrorToast);
  }, [loadTanks, showErrorToast]);

  // CRUD Actions
  const onAdd = useCallback(() => {
    setSelectedTank(emptyTankEntity);
    setFormVisible(true);
  }, []);

  const onEdit = useCallback((tank: TankEntity) => {
    setSelectedTank(tank);
    setFormVisible(true);
  }, []);

  const onDelete = useCallback(
    async (tank: TankEntity) => {
      if (!tank.id) return;

      try {
        await deleteTank(tank.id);
        showSuccessToast(t("success.data_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteTank, showErrorToast, showSuccessToast, t]
  );

  const onSave = useCallback(
    async (tankDto: TankDTO) => {
      try {
        await saveTank(tankDto);
        showSuccessToast(t("success.data_saved"));
        setFormVisible(false);
        setSelectedTank(null);
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [saveTank, showErrorToast, showSuccessToast, t]
  );

  const onCancel = useCallback(() => {
    setFormVisible(false);
    setSelectedTank(null);
  }, []);

  // Filter Actions
  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
    setFormVisible(false);
    setSelectedTank(null);
  }, []);

  const handleSetFilters = useCallback(
    (newFilters: any) => {
      setFilters(newFilters);
      setFormVisible(false);
      setSelectedTank(null);
    },
    [setFilters]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setFormVisible(false);
    setSelectedTank(null);
  }, [clearFilters]);

  return {
    // Data
    tanks: filteredTanks,
    allTanks: tanks,
    selectedTank,
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
    reload: loadTanks,
  };
}
