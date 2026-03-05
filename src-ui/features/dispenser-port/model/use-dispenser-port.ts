import { useState, useCallback, useEffect } from "react";
import { useDispenserPortStore } from "@/entities/dispenser-port";
import { emptyDispenserPort } from "@/entities/dispenser-port";
import type { DispenserPortEntity } from "@/entities/dispenser-port";
import { useToast } from "@/shared/hooks/use-toast";
import { useDispenserPortFilters } from "./use-dispenser-port-filters";
import { useTranslation } from "react-i18next";
import { DispenserPortDTO } from "@/shared/bindings/DispenserPortDTO";

export function useDispenserPort() {
  // Form state
  const [selectedDispenserPort, setSelectedDispenserPort] =
    useState<DispenserPortEntity | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { t } = useTranslation();

  // Store
  const {
    dispenserPorts,
    loading,
    loadDispenserPorts,
    saveDispenserPort,
    deleteDispenserPort,
  } = useDispenserPortStore();

  // Filters
  const {
    filters,
    filteredDispenserPorts,
    hasActiveFilters,
    setFilters,
    clearFilters,
  } = useDispenserPortFilters(dispenserPorts);

  const { showErrorToast, showSuccessToast } = useToast();

  // Load dispenser ports on mount
  useEffect(() => {
    loadDispenserPorts().catch(showErrorToast);
  }, [loadDispenserPorts, showErrorToast]);

  // CRUD Actions
  const onAdd = useCallback(() => {
    setSelectedDispenserPort(emptyDispenserPort);
    setFormVisible(true);
  }, []);

  const onEdit = useCallback((dispenserPort: DispenserPortEntity) => {
    setSelectedDispenserPort(dispenserPort);
    setFormVisible(true);
  }, []);

  const onDelete = useCallback(
    async (dispenserPort: DispenserPortEntity) => {
      if (!dispenserPort.id) return;

      try {
        await deleteDispenserPort(dispenserPort.id);
        showSuccessToast(t("success.data_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteDispenserPort, showErrorToast, showSuccessToast, t],
  );

  const onSave = useCallback(
    async (dispenserPort: DispenserPortDTO) => {
      try {
        await saveDispenserPort(dispenserPort);
        showSuccessToast(
          dispenserPort.id
            ? t("success.data_updated")
            : t("success.data_created"),
        );
        setFormVisible(false);
        setSelectedDispenserPort(null);
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [saveDispenserPort, showErrorToast, showSuccessToast, t],
  );

  const onCancel = useCallback(() => {
    setFormVisible(false);
    setSelectedDispenserPort(null);
  }, []);

  // Filter Actions
  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
    setFormVisible(false);
    setSelectedDispenserPort(null);
  }, []);

  const handleSetFilters = useCallback(
    (newFilters: any) => {
      setFilters(newFilters);
      setFormVisible(false);
      setSelectedDispenserPort(null);
    },
    [setFilters],
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setFormVisible(false);
    setSelectedDispenserPort(null);
  }, [clearFilters]);

  return {
    // Data
    dispenserPorts: filteredDispenserPorts,
    allDispenserPorts: dispenserPorts,
    selectedDispenserPort,
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
    reload: loadDispenserPorts,
  };
}
