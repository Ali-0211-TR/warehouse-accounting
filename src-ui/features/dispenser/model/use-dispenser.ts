import type { DispenserEntity, NozzleEntity } from "@/entities/dispenser";
import { emptyDispenserEntity, useDispenserStore } from "@/entities/dispenser";
import { DispenserDTO } from "@/shared/bindings/DispenserDTO";
import { NozzleDTO } from "@/shared/bindings/NozzleDTO";
import { useToast } from "@/shared/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispenserFilters } from "./use-dispenser-filters";

export function useDispenser() {
  // Form state
  const [selectedDispenser, setSelectedDispenser] =
    useState<DispenserEntity | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Nozzle management state
  const [selectedNozzle, setSelectedNozzle] = useState<NozzleEntity | null>(
    null
  );
  const [nozzleFormVisible, setNozzleFormVisible] = useState(false);
  const [selectedDispenserId, setSelectedDispenserId] = useState<string | null>(
    null
  );

  const { t } = useTranslation();

  // Store
  const {
    dispensers,
    loading,
    loadDispensers,
    saveDispenser,
    deleteDispenser,
    // Nozzle actions
    saveNozzle,
    getNozzles,
    deleteNozzle,
    // Totals data
    totals,
    getTotalByAddress,
    // Summary totals data
    summaryTotals,
    loadSummaryTotals,
    getSummaryTotalByNozzleId,
    getAllSummaryTotals,
    clearSummaryTotals,
    // Add ordering functions
    getOrderedDispensers,
    moveDispenser,
    setDispenserOrder,
  } = useDispenserStore();

  // Filters
  const {
    filters,
    filteredDispensers,
    hasActiveFilters,
    setFilters,
    clearFilters,
  } = useDispenserFilters(dispensers);

  const { showErrorToast, showSuccessToast } = useToast();

  // Load dispensers on mount
  useEffect(() => {
    loadDispensers().catch(showErrorToast);
  }, [loadDispensers, showErrorToast]);

  // CRUD Actions for Dispensers
  const onAdd = useCallback(() => {
    setSelectedDispenser(emptyDispenserEntity);
    setFormVisible(true);
  }, []);

  const onEdit = useCallback((dispenser: DispenserEntity) => {
    setSelectedDispenser(dispenser);
    setFormVisible(true);
  }, []);

  const onDelete = useCallback(
    async (dispenser: DispenserEntity) => {
      if (!dispenser.id) return;

      try {
        await deleteDispenser(dispenser.id);
        showSuccessToast(t("success.data_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteDispenser, showErrorToast, showSuccessToast, t]
  );

  const onSave = useCallback(
    async (dispenserDto: DispenserDTO) => {
      try {
        await saveDispenser(dispenserDto);
        showSuccessToast(t("success.data_created"));
        setFormVisible(false);
        setSelectedDispenser(null);
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [saveDispenser, showErrorToast, showSuccessToast, t]
  );

  const onCancel = useCallback(() => {
    setFormVisible(false);
    setSelectedDispenser(null);
  }, []);

  // CRUD Actions for Nozzles
  const onAddNozzle = useCallback((dispenserId: string) => {
    setSelectedDispenserId(dispenserId);
    setSelectedNozzle(null); // null indicates new nozzle
    setNozzleFormVisible(true);
  }, []);

  const onEditNozzle = useCallback((nozzle: NozzleEntity) => {
    setSelectedNozzle(nozzle);
    setSelectedDispenserId(nozzle.dispenser_id);
    setNozzleFormVisible(true);
  }, []);

  const onDeleteNozzle = useCallback(
    async (nozzle: NozzleEntity) => {
      if (!nozzle.id) return;

      try {
        await deleteNozzle(nozzle.id);
        showSuccessToast(t("success.nozzle_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteNozzle, showErrorToast, showSuccessToast, t]
  );

  const onSaveNozzle = useCallback(
    async (nozzleDto: NozzleDTO) => {
      try {
        await saveNozzle(nozzleDto);
        showSuccessToast(
          nozzleDto.id
            ? t("success.nozzle_updated")
            : t("success.nozzle_created")
        );
        setNozzleFormVisible(false);
        setSelectedNozzle(null);
        setSelectedDispenserId(null);
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [saveNozzle, showErrorToast, showSuccessToast, t]
  );

  const onCancelNozzle = useCallback(() => {
    setNozzleFormVisible(false);
    setSelectedNozzle(null);
    setSelectedDispenserId(null);
  }, []);

  const loadNozzles = useCallback(
    async (dispenserId: string) => {
      try {
        return await getNozzles(dispenserId);
      } catch (error: any) {
        showErrorToast(error.message);
        return [];
      }
    },
    [getNozzles, showErrorToast]
  );

  // Summary totals actions
  const loadSummaryData = useCallback(
    async (startDate?: string, endDate?: string) => {
      try {
        return await loadSummaryTotals(startDate, endDate);
      } catch (error: any) {
        showErrorToast(error.message);
        return [];
      }
    },
    [loadSummaryTotals, showErrorToast]
  );

  // Filter Actions
  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
    setFormVisible(false);
    setSelectedDispenser(null);
  }, []);

  const handleSetFilters = useCallback(
    (newFilters: any) => {
      setFilters(newFilters);
      setFormVisible(false);
      setSelectedDispenser(null);
    },
    [setFilters]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setFormVisible(false);
    setSelectedDispenser(null);
  }, [clearFilters]);

  // Helper to get nozzles for a specific dispenser from state
  const getDispenserNozzles = useCallback(
    (dispenserId: string): NozzleEntity[] => {
      const dispenser = dispensers.find(d => d.id === dispenserId);
      return dispenser?.nozzles || [];
    },
    [dispensers]
  );

  return {
    // Data
    filteredDispensers,
    dispensers,
    selectedDispenser,
    loading,
    totals,
    getTotalByAddress,

    // Summary totals data
    summaryTotals,
    loadSummaryData,
    getSummaryTotalByNozzleId,
    getAllSummaryTotals,
    clearSummaryTotals,

    // Form state
    formVisible,
    filtersVisible,

    // Nozzle state
    selectedNozzle,
    nozzleFormVisible,
    selectedDispenserId,

    // Filter state
    filters,
    hasActiveFilters,

    // CRUD actions for dispensers
    onAdd,
    onEdit,
    onDelete,
    onSave,
    onCancel,

    // CRUD actions for nozzles
    onAddNozzle,
    onEditNozzle,
    onDeleteNozzle,
    onSaveNozzle,
    onCancelNozzle,
    loadNozzles,
    getDispenserNozzles,

    // Filter actions
    onShowFilters,
    onHideFilters,
    setFilters: handleSetFilters,
    clearFilters: handleClearFilters,

    // Ordering actions
    getOrderedDispensers,
    moveDispenser,
    setDispenserOrder,

    // Utilities
    reload: loadDispensers,
  };
}
