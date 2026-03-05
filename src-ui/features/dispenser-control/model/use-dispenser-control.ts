import type { NozzleEntity } from "@/entities/dispenser";
import { DispenserEntity, useDispenserStore } from "@/entities/dispenser";
import { dispenserApi } from "@/entities/dispenser/api/dispenser-api";
import type { DispenserFuelingState } from "@/shared/bindings/DispenserFuelingState";
import type { FuelingOrderEntity } from "@/shared/bindings/FuelingOrderEntity";
import type { PresetType } from "@/shared/bindings/PresetType";
import { useToast } from "@/shared/hooks/use-toast";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

export function useDispenserControl(dispenserId: string) {
  const {
    dispensers,
    updateDispenser,
    setDispenserPreset,
    clearDispenserPreset,
    setSelectedNozzleByUser,
  } = useDispenserStore();

  const { showErrorToast, showSuccessToast } = useToast();
  const { t } = useTranslation();

  // Get current dispenser from store (always up-to-date via events)
  const dispenser = useMemo(() => {
    return dispensers.find(d => d.id === dispenserId);
  }, [dispensers, dispenserId]);

  // Get preset from store (direct subscription for UI reactivity)
  // Note: We use both subscription (for UI updates) and direct store access (for commands)
  // because subscription can sometimes have closure/timing issues in async callbacks
  const preset = useDispenserStore(state => {
    const currentPreset = state.presets[dispenserId] || null;
    // Only log when preset actually exists or changes
    if (currentPreset) {
    }
    return currentPreset;
  });

  // Get the selected nozzle for this dispenser
  const selectedNozzle = useMemo((): NozzleEntity | null => {
    if (!dispenser) return null;
    const nozzleId = dispenser.selected_nozzle_id;
    return dispenser.nozzles.find(n => n.id === nozzleId) ?? null;
  }, [dispenser]);

  // Get severity based on dispenser state
  const getSeverity = useCallback(():
    | "danger"
    | "success"
    | "info"
    | "warning"
    | "secondary"
    | "contrast"
    | undefined => {
    if (!dispenser) return "warning";
    const { pause, start, nozzle_down } = dispenser.fueling_state;
    if (pause) return "danger";
    if (start) return "success";
    if (nozzle_down) return "info";
    return "warning";
  }, [dispenser]);

  // Get current nozzle (alias for selectedNozzle for compatibility)
  const getNozzle = useCallback((): NozzleEntity | null => {
    return selectedNozzle;
  }, [selectedNozzle]);

  // Set preset values (store as single source of truth)
  const setPreset = useCallback(
    (presetType: PresetType, value: number) => {
      if (!selectedNozzle) {
        return;
      }

      const newPreset: FuelingOrderEntity = {
        id: null,
        preset_type: presetType,
        preset_volume: presetType === "Volume" ? value : 0,
        preset_amount: presetType === "Amount" ? value : 0,
        title: selectedNozzle.tank?.name ?? "",
        d_created: new Date().toISOString(),
        nozzle_id: selectedNozzle.id ?? "",
        fueling_type: "Regular",
        volume: 0,
        amount: 0,
        order_item_id: "",
        d_move: null,
      };

      setDispenserPreset(dispenserId, newPreset);

      // Debug: only check if preset was set (simplified)
      setTimeout(() => {
        const storeState = useDispenserStore.getState();
        const checkPreset = storeState.presets[dispenserId];
        if (!checkPreset) {
          console.error("❌ PRESET NOT FOUND IN STORE AFTER SETTING!");
        } else {
        }
      }, 100);
    },
    [selectedNozzle, dispenserId, setDispenserPreset]
  );

  // Clear preset when needed
  const clearPreset = useCallback(() => {
    clearDispenserPreset(dispenserId);
  }, [dispenserId, clearDispenserPreset]);

  // Get backend preset for selected nozzle
  const getBackendPreset = useCallback(() => {
    if (!selectedNozzle?.address) return null;
    return useDispenserStore.getState().getNozzlePreset(selectedNozzle.address);
  }, [selectedNozzle?.address]);

  // Clear backend preset for selected nozzle
  const clearBackendPreset = useCallback(() => {
    if (!selectedNozzle?.address) return;
    useDispenserStore.getState().clearNozzlePreset(selectedNozzle.address);
  }, [selectedNozzle?.address]);

  // Update fueling data in store
  const setFueling = useCallback(
    (volume: number, amount: number) => {
      if (!preset) return;
      setDispenserPreset(dispenserId, {
        ...preset,
        volume,
        amount,
      });
    },
    [preset, dispenserId, setDispenserPreset]
  );

  // Update dispenser state in store
  const setDispenserState = useCallback(
    (state: DispenserFuelingState) => {
      if (!dispenser) return;

      const updatedDispenser: DispenserEntity = {
        ...dispenser,
        fueling_state: state,
      };

      updateDispenser(updatedDispenser);
    },
    [dispenser, updateDispenser]
  );

  // Update selected nozzle in store (user selection)
  const setDispenserNozzle = useCallback(
    (nozzle: NozzleEntity | null) => {
      if (!dispenser || !dispenser.id) return;

      // Use the new user selection method to preserve user choice
      setSelectedNozzleByUser(dispenser.id, nozzle?.id ?? null);

      // Clear preset when nozzle changes
      if (preset) {
        clearPreset();
      }
    },
    [dispenser, setSelectedNozzleByUser, preset, clearPreset]
  );

  // Control Commands
  const cmdStartFueling = useCallback(async () => {

    // Get preset directly from store to avoid subscription issues
    const storeState = useDispenserStore.getState();
    const currentPreset = storeState.presets[dispenserId];

    const hasSelectedNozzle = !!selectedNozzle;
    const hasCurrentPreset = !!currentPreset;
    const hasDispenserId = !!dispenser?.id;


    if (!hasSelectedNozzle || !hasCurrentPreset || !hasDispenserId) {
      showErrorToast(t("dispenser_control.missing_nozzle_preset_dispenser"));
      return;
    }

    const presetValue =
      currentPreset.preset_type === "Volume"
        ? currentPreset.preset_volume
        : currentPreset.preset_amount;

    try {
      await dispenserApi.startFueling({
        address: selectedNozzle.address,
        preset_type: currentPreset.preset_type,
        preset: presetValue,
        price: 6000,
      });

      showSuccessToast(t("dispenser_control.fueling_started"));
      // Clear preset after successful start
      clearPreset();
    } catch (error: any) {
      console.error("Error starting fueling:", error);

      // Handle specific error cases
      const errorMessage = error.message || "";
      if (errorMessage === "dispenser_error.shift_is_not_opened") {
        showErrorToast(t("dispenser_control.shift_not_opened"));
      } else {
        showErrorToast(
          error.message || t("dispenser_control.failed_to_start_fueling")
        );
      }
    }
  }, [
    selectedNozzle,
    dispenserId,
    dispenser,
    showErrorToast,
    showSuccessToast,
    clearPreset,
    t,
  ]);

  const cmdStopFueling = useCallback(async () => {
    if (!selectedNozzle) {
      showErrorToast(t("dispenser_control.no_nozzle_selected"));
      return;
    }

    try {
      await dispenserApi.stopFueling(selectedNozzle.address);
      showSuccessToast(t("dispenser_control.fueling_stopped"));
    } catch (error: any) {
      showErrorToast(
        error.message || t("dispenser_control.failed_to_stop_fueling")
      );
    }
  }, [selectedNozzle, showErrorToast, showSuccessToast, t]);

  const cmdPauseFueling = useCallback(async () => {
    if (!selectedNozzle) {
      showErrorToast(t("dispenser_control.no_nozzle_selected"));
      return;
    }

    try {
      await dispenserApi.pauseFueling(selectedNozzle.address);
      showSuccessToast(t("dispenser_control.fueling_paused"));
    } catch (error: any) {
      showErrorToast(
        error.message || t("dispenser_control.failed_to_pause_fueling")
      );
    }
  }, [selectedNozzle, showErrorToast, showSuccessToast, t]);

  const cmdResumeFueling = useCallback(async () => {
    if (!selectedNozzle) {
      showErrorToast(t("dispenser_control.no_nozzle_selected"));
      return;
    }

    try {
      await dispenserApi.resumeFueling(selectedNozzle.address);
      showSuccessToast(t("dispenser_control.fueling_resumed"));
    } catch (error: any) {
      showErrorToast(
        error.message || t("dispenser_control.failed_to_resume_fueling")
      );
    }
  }, [selectedNozzle, showErrorToast, showSuccessToast, t]);

  const selectNextNozzle = useCallback(async () => {
    if (!dispenser) return;

    try {
      await dispenserApi.selectNextNozzle(dispenser.base_address);
      showSuccessToast(t("dispenser_control.next_nozzle_selected"));
    } catch (error: any) {
      showErrorToast(
        error.message || t("dispenser_control.failed_to_select_next_nozzle")
      );
    }
  }, [dispenser, showErrorToast, showSuccessToast, t]);

  const setPrice = useCallback(
    async (price: number | string) => {
      if (!dispenser || !selectedNozzle) {
        showErrorToast(t("dispenser_control.no_dispenser_or_nozzle_selected"));
        return;
      }

      // Convert price to number if it's a string
      const priceNum = typeof price === "string" ? Number(price) : price;

      if (isNaN(priceNum)) {
        showErrorToast(t("dispenser_control.invalid_price"));
        return;
      }

      try {
        const success = await dispenserApi.writePrice(
          selectedNozzle.address,
          priceNum
        );
        if (success) {
          showSuccessToast(t("dispenser_control.price_set_successfully"));
        } else {
          showErrorToast(t("dispenser_control.failed_to_set_price"));
        }
      } catch (error: any) {
        showErrorToast(
          error.message || t("dispenser_control.failed_to_set_price")
        );
      }
    },
    [dispenser, showErrorToast]
  );

  return {
    // Data (always current from store)
    dispenser,
    preset, // Now from store
    selectedNozzle,

    // Computed
    getSeverity,
    getNozzle,

    // State setters (update store)
    setPreset, // Updates store
    clearPreset, // New function
    getBackendPreset, // Get backend preset for selected nozzle
    clearBackendPreset, // Clear backend preset for selected nozzle
    setFueling,
    setDispenserState,
    setDispenserNozzle,

    // Control commands
    cmdStartFueling,
    cmdStopFueling,
    cmdPauseFueling,
    cmdResumeFueling,
    selectNextNozzle,
    setPrice,
  };
}
