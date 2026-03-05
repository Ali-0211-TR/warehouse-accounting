import { useState, useCallback, useEffect } from "react";
import { useShiftStore } from "@/entities/shift";
import type { ShiftEntity, ShiftFilterState } from "@/entities/shift";
import { useToast } from "@/shared/hooks/use-toast";
import { SortOrder } from "@/shared/bindings/SortOrder";
import { ShiftSortField } from "@/entities/shift/model/types";
import { useTranslation } from "react-i18next";
import { ShiftDTO } from "@/shared/bindings/dtos/ShiftDTO";
import { useDispenser } from "@/features/dispenser";
import { dispenserApi, useDispenserStore } from "@/entities/dispenser";

export function useShift() {
  const { t } = useTranslation(); // Fix: Add translation hook
  const [selectedShift, setSelectedShift] = useState<ShiftEntity | null>(null);

  const [filtersVisible, setFiltersVisible] = useState(false);
  const [openShiftVisible, setOpenShiftVisible] = useState(false);
  const [closeShiftVisible, setCloseShiftVisible] = useState(false);

  // Add specific loading states
  const [openingShift, setOpeningShift] = useState(false);
  const [closingShift, setClosingShift] = useState(false);
  const [deletingShift, setDeletingShift] = useState(false);

  const {
    shifts,
    pagination,
    loading,
    query,
    currentShift,
    loadShifts,
    openShift,
    closeShift,
    deleteShift,
    getCurrentShift,
    pageChange,
  } = useShiftStore();

  const { dispensers } = useDispenser();
  const store = useDispenserStore();

  const { showErrorToast, showSuccessToast } = useToast();

  // Fix: Better error handling and cleanup
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        if (isMounted) {
          await loadShifts();
          await getCurrentShift();
        }
      } catch (error: any) {
        if (isMounted) {
          showErrorToast(error.message);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [loadShifts, getCurrentShift, showErrorToast]);

  const onDelete = useCallback(
    async (shift: ShiftEntity) => {
      if (!shift.id) return;

      // Add confirmation
      const confirmed = window.confirm(
        t("shift.confirm_delete", { id: shift.id }),
      );
      if (!confirmed) return;

      setDeletingShift(true);
      try {
        await deleteShift(shift.id);
        showSuccessToast(t("success.data_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      } finally {
        setDeletingShift(false);
      }
    },
    [deleteShift, showErrorToast, showSuccessToast, t],
  );

  const onOpenShift = useCallback(() => {
    setOpenShiftVisible(true);
  }, []);

  const onCloseShift = useCallback(() => {
    setCloseShiftVisible(true);
  }, []);

  const onOpenShiftSubmit = useCallback(
    async (data: ShiftDTO) => {
      setOpeningShift(true);
      try {
        var {hasErrorInComm, dName}: {hasErrorInComm: boolean; dName: Array<string>} = {
          hasErrorInComm: false,
          dName: []
        };

         dispensers.map((d) => {
           const hasErrorInCommTemp = (store.getDispenserCommStatus(d.id ?? '') === "offline") && d.state === 'Active';
           if (hasErrorInCommTemp) {
             dName.push(d.name);
             hasErrorInComm = hasErrorInCommTemp;
           }
          // return hasErrorInComm;
        });

        if (hasErrorInComm) {
          showErrorToast(`Dispenser ${dName.join(', ')} is not Online`);
          return;
        } else {
        }
        await openShift(data);
        showSuccessToast(t("shift.opened_successfully"));
        setOpenShiftVisible(false);
      } catch (error: any) {
        showErrorToast(error.message);
      } finally {
        setOpeningShift(false);
      }
    },
    [openShift, showErrorToast, showSuccessToast, t],
  );

  const onCloseShiftSubmit = useCallback(
    async (data: ShiftDTO) => {
      setClosingShift(true);

      try {
        var {hasErrorInComm, dName}: {hasErrorInComm: boolean; dName: Array<string>} = {
          hasErrorInComm: false,
          dName: []
        };

         dispensers.map((d) => {
           const hasErrorInCommTemp = (store.getDispenserCommStatus(d.id ?? '') === "offline") && d.state === 'Active';
           if (hasErrorInCommTemp) {
             dName.push(d.name);
             hasErrorInComm = hasErrorInCommTemp;
           }
          // return hasErrorInComm;
        });

        if (hasErrorInComm) {
          showErrorToast(`Dispenser ${dName.join(', ')} is not Online`);
          return;
        } else {
        }

        // Очистка totals
        for (const d of dispensers) {
          for (const n of d.nozzles) {
            await dispenserApi.clearShiftTotal(n.address); // если async
            // dispenserApi.clearShiftTotal(n.address);     // если sync
          }
        }

        await closeShift(data);

        showSuccessToast(t("shift.closed_successfully"));
        setCloseShiftVisible(false);
      } catch (error: any) {
        showErrorToast(error?.message ?? "Unknown error");
      } finally {
        setClosingShift(false);
      }
    },
    [
      dispensers,
      dispenserApi,
      closeShift,
      showErrorToast,
      showSuccessToast,
      t,
      setCloseShiftVisible,
    ],
  );


  const onCancel = useCallback(() => {
    // setFormVisible(false)
    setOpenShiftVisible(false);
    setCloseShiftVisible(false);
    setSelectedShift(null);
  }, []);

  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
  }, []);

  const setFilters = useCallback(
    (filters: ShiftFilterState) => {
      loadShifts({ filters });
    },
    [loadShifts],
  );

  const clearFilters = useCallback(() => {
    const emptyFilters: ShiftFilterState = {
      search: "",
      user_id: undefined,
      date_range: undefined,
      is_open: undefined,
    };
    loadShifts({ filters: emptyFilters });
  }, [loadShifts]);

  const hasActiveFilters = query.filters
    ? query.filters.search !== "" ||
    query.filters.user_id !== undefined ||
    query.filters.date_range !== undefined ||
    query.filters.is_open !== undefined
    : false;

  // Map frontend sort field names to backend ShiftColumn enum values
  const mapSortFieldToBackend = (field: string): ShiftSortField => {
    const fieldMapping: Record<string, ShiftSortField> = {
      id: "Id",
      d_open: "DOpen",
      d_close: "DClose",
      user_open: "UserOpenId",
      user_close: "UserCloseId",
    };
    return fieldMapping[field] || "DOpen";
  };

  // Convert frontend sort order (1 | -1) to backend SortOrder enum
  const onSort = useCallback((field: string, order: 1 | -1) => {
    const sortOrder: SortOrder = order === 1 ? "Asc" : "Desc";
    const backendField = mapSortFieldToBackend(field);
    loadShifts({ sortField: backendField, sortOrder });
  }, []);

  return {
    shifts,
    selectedShift,
    currentShift,
    loading,

    filtersVisible,
    openShiftVisible,
    closeShiftVisible,
    filters: query.filters || {
      search: "",
      user_id: undefined,
      date_range: undefined,
      is_open: undefined,
    },
    hasActiveFilters,
    pagination,

    onDelete,
    onOpenShift,
    onCloseShift,
    onOpenShiftSubmit,
    onCloseShiftSubmit,
    onCancel,
    onShowFilters,
    onHideFilters,
    setFilters,
    clearFilters,
    pageChange,
    onSort,
    reload: loadShifts,
    reloadCurrent: getCurrentShift,
    openingShift,
    closingShift,
    deletingShift,
  };
}
