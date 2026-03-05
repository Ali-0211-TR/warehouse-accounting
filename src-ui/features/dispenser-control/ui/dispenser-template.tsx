import {
  DispenserEntity,
  NozzleEntity,
  useDispenserStore,
} from "@/entities/dispenser";
import { useOrderStore } from "@/entities/order";
import { getSalePrice } from "@/entities/product";
import { FuelingOrderEntity } from "@/shared/bindings/FuelingOrderEntity";
import { PresetType } from "@/shared/bindings/PresetType";
import { NumericInput } from "@/shared/ui/NumericInput";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Card } from "@/shared/ui/shadcn/card";
import { Label } from "@/shared/ui/shadcn/label";
import { Progress } from "@/shared/ui/shadcn/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { t } from "i18next";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  ClipboardList,
  Clock,
  FastForward,
  FileUp,
  Pause,
  Play,
  ShoppingCart,
  Square,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getStateLabel } from "../model/helper";
import { useDispenserControl } from "../model/use-dispenser-control";

type DispenserTemplateProps = {
  dispenser: DispenserEntity;
  handleOpenHistory: (dispenserId: string) => void;
};

// Separate memoized ControlButtons component to prevent unnecessary re-renders
const ControlButtons = memo(
  ({
    dispenser,
    isActive,
    activeOrderId,
    fuelingOrder,
    cmdResumeFueling,
    cmdPauseFueling,
    cmdStopFueling,
    cmdStartFueling,
    openOrdersSheet,
    closeFueling,
    handleOpenHistory,
  }: {
    dispenser: DispenserEntity;
    isActive: boolean;
    activeOrderId: string | null;
    fuelingOrder: FuelingOrderEntity | null;
    cmdResumeFueling: () => void;
    cmdPauseFueling: () => void;
    cmdStopFueling: () => void;
    cmdStartFueling: () => void;
    openOrdersSheet: (orderId: string | null) => void;
    closeFueling: (orderId: string) => void;
    handleOpenHistory: (id: string) => void;
  }) => {
    const buttons = [];

    // Order button - only show when there's an active order
    if (activeOrderId) {
      buttons.push(
        <TooltipProvider key="order">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => openOrdersSheet(activeOrderId)}
                disabled={!isActive}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("control.view_active_order", "Faol buyurtmani ko'rish")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Fueling control buttons based on current state
    if (dispenser.fueling_state?.start) {
      // Currently fueling - show pause/resume and stop
      if (dispenser.fueling_state?.pause) {
        buttons.push(
          <TooltipProvider key="resume">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={cmdResumeFueling}
                  disabled={!isActive}
                >
                  <FastForward className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {t(
                    "control.resume_fueling",
                    "Yoqilg'i quyishni davom ettirish"
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      } else {
        buttons.push(
          <TooltipProvider key="pause">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={cmdPauseFueling}
                  disabled={!isActive}
                >
                  <Pause className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {t("control.pause_fueling", "Yoqilg'i quyishni to'xtatish")}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      buttons.push(
        <TooltipProvider key="stop">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                onClick={cmdStopFueling}
                disabled={!isActive}
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("control.stop_fueling", "Yoqilg'i quyishni to'xtatish")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      // Not fueling - show start or upload button
      if (activeOrderId && fuelingOrder?.d_move == null) {
        buttons.push(
          <TooltipProvider key="upload">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  onClick={() => {
                    closeFueling(activeOrderId);
                  }}
                  disabled={!isActive}
                >
                  <FileUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {t("control.close_fueling", "Yoqilg'i quyishni yakunlash")}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      } else if (!activeOrderId) {
        buttons.push(
          <TooltipProvider key="start">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  onClick={cmdStartFueling}
                  disabled={!isActive}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {t("control.start_fueling", "Yoqilg'i quyishni boshlash")}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    }

    // History button - always available
    buttons.push(
      <TooltipProvider key="history">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => handleOpenHistory(dispenser.id!)}
              disabled={!isActive}
            >
              <ClipboardList className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("control.order_history", "Buyurtmalar tarixi")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    return (
      <div className="flex flex-row gap-4 justify-center flex-wrap">
        {buttons}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if fueling state changes (the main trigger for control button updates)
    const prevFuelingState = prevProps.dispenser.fueling_state;
    const nextFuelingState = nextProps.dispenser.fueling_state;

    if (
      prevFuelingState?.start !== nextFuelingState?.start ||
      prevFuelingState?.pause !== nextFuelingState?.pause
    ) {
      return false;
    }

    // Re-render if active order ID changes
    if (prevProps.activeOrderId !== nextProps.activeOrderId) {
      return false;
    }

    // Re-render if online status changes
    if (prevProps.isActive !== nextProps.isActive) {
      return false;
    }

    // Re-render if fueling order completion status changes
    if (prevProps.fuelingOrder?.d_move !== nextProps.fuelingOrder?.d_move) {
      return false;
    }

    // Don't re-render for other changes (like volume/amount updates during fueling)
    // Removed verbose skip logging - only log when actually re-rendering
    return true;
  }
);

// Separate PresetForm component to prevent state reset issues
const PresetForm = memo(
  ({
    dispenser,
    selectedNozzle,
    setPreset,
    onStartFueling, // Add this prop
  }: {
    dispenser: DispenserEntity;
    selectedNozzle: NozzleEntity | null;
    setPreset: (presetType: PresetType, value: number) => void;
    onStartFueling?: () => void; // Add this prop type
  }) => {
    const [presetVolume, setPresetVolume] = useState<number>(0);
    const [presetAmount, setPresetAmount] = useState<number>(0);

    // Get backend preset data for the selected nozzle
    const backendPreset = useDispenserStore(state => {
      if (!selectedNozzle?.address) return null;
      return state.getNozzlePreset(selectedNozzle.address);
    });

    // Update local state when backend preset changes
    useEffect(() => {
      if (backendPreset) {
        if (backendPreset.presetType === "Volume") {
          setPresetVolume(backendPreset.presetValue);
          setPresetAmount(0);
        } else if (backendPreset.presetType === "Amount") {
          setPresetAmount(backendPreset.presetValue);
          setPresetVolume(0);
        }
        // Also update the store preset
        setPreset(
          backendPreset.presetType as PresetType,
          backendPreset.presetValue
        );
      }
    }, [backendPreset, dispenser.id, setPreset]);

    const handleInput = useCallback(
      (presetType: PresetType, value: number) => {
        if (presetType == "Amount") {
          setPresetAmount(value);
          setPresetVolume(0);
        } else {
          setPresetVolume(value);
          setPresetAmount(0);
        }
        setPreset(presetType, value);

        // Clear backend preset when user inputs new value
        if (selectedNozzle?.address && backendPreset) {
          useDispenserStore
            .getState()
            .clearNozzlePreset(selectedNozzle.address);
        }
      },
      [dispenser.id, setPreset, selectedNozzle?.address, backendPreset]
    );

    const handleEnterPress = useCallback(() => {
      // Only start fueling if there's a preset value and start fueling function is available
      if ((presetVolume > 0 || presetAmount > 0) && onStartFueling) {
        onStartFueling();
      }
    }, [presetVolume, presetAmount, onStartFueling, dispenser.id]);

    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Backend preset indicator */}
        {/* {backendPreset && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
              <span className="text-xs font-medium">
                📡 Backend: {backendPreset.presetType} ={" "}
                {backendPreset.presetValue}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-blue-600 hover:text-blue-800"
                onClick={() => {
                  if (selectedNozzle?.address) {
                    useDispenserStore
                      .getState()
                      .clearNozzlePreset(selectedNozzle.address);
                  }
                }}
              >
                ✕
              </Button>
            </div>
          </div>
        )} */}

        <div className="flex flex-row gap-3 w-full bg">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="preset-volume" className="text-lg font-medium">
              {t("control.volume", { volume: "мк" })}
              {backendPreset?.presetType === "Volume" && (
                <span className="text-color text-sm text-muted-foreground">
                  (KB)
                </span>
              )}
            </Label>
            <NumericInput
              value={presetVolume}
              onChange={value => handleInput("Volume", value)}
              onEnterPress={handleEnterPress} // Add this line
              suffix={selectedNozzle?.tank?.product?.unit?.short_name || ""}
            // placeholder={t("control.enter_volume", "Hajm")}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="preset-amount" className="text-lg font-medium">
              {t("control.amount", { amount: "с" })}
              {backendPreset?.presetType === "Amount" && (
                <span className="text-sm text-muted-foreground">(KB)</span>
              )}
            </Label>
            <NumericInput
              value={presetAmount}
              onChange={value => handleInput("Amount", value)}
              onEnterPress={handleEnterPress} // Add this line
              suffix={t("с")}
            // placeholder={t("control.enter_amount", "Summa")}
            />
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Update comparison to include onStartFueling
    return (
      prevProps.dispenser.id === nextProps.dispenser.id &&
      prevProps.selectedNozzle?.id === nextProps.selectedNozzle?.id &&
      prevProps.selectedNozzle?.address === nextProps.selectedNozzle?.address &&
      prevProps.setPreset === nextProps.setPreset &&
      prevProps.onStartFueling === nextProps.onStartFueling
    );
  }
);

export const DispenserTemplate = memo(
  ({ dispenser, handleOpenHistory }: DispenserTemplateProps) => {
    // Memoize nozzle IDs first to prevent unnecessary recalculations
    const nozzleIds = useMemo(
      () =>
        dispenser.nozzles
          .map(nozzle => nozzle.id)
          .filter((id): id is string => id != null),
      [dispenser.nozzles]
    );

    // Get activeOrder after nozzleIds is available
    const activeOrderId = useOrderStore(state => {
      const matchingOrder = state.activeOrders.find(order => {
        if (!order.fueling_order_item_id) return false;
        const fuelingOrderItem = order.items.find(
          (item: any) => item.id === order.fueling_order_item_id
        );
        return (
          fuelingOrderItem?.fueling_order?.nozzle_id != null &&
          nozzleIds.includes(fuelingOrderItem.fueling_order.nozzle_id)
        );
      });
      const orderId = matchingOrder?.id || null;
      return orderId;
    });

    // ISOLATED SUBSCRIPTION: Only get THIS specific order data
    const activeOrder = useOrderStore(state => {
      if (!activeOrderId) return null;
      return (
        state.activeOrders.find(order => order.id === activeOrderId) || null
      );
    });

    // Extract fueling order data
    const fuelingOrder = useMemo((): FuelingOrderEntity | null => {
      if (!activeOrder || !activeOrder.items) return null;
      const { fueling_order_item_id, items } = activeOrder;
      const orderItem = items.find(
        (item: any) => item.id === fueling_order_item_id
      );
      return orderItem?.fueling_order ?? null;
    }, [activeOrder]);

    // Get order actions without store subscription
    const openOrdersSheet = useCallback((orderId: string | null) => {
      if (orderId !== null) {
        useOrderStore.getState().openOrdersSheet(orderId);
      }
    }, []);

    const closeFueling = useCallback((orderId: string) => {
      useOrderStore.getState().closeFueling(orderId);
    }, []);

    // Get the actual communication status value from the store for reactivity (optimized)
    const communicationStatus = useDispenserStore(
      useCallback(
        state =>
          dispenser.id != null
            ? state.communicationStatus[dispenser.id]
            : undefined,
        [dispenser.id]
      )
    );

    // Derive the communication status string from the boolean value
    const commStatus = communicationStatus === true ? "online" : "offline";

    // Use the hook with dispenser ID
    const {
      setPreset,
      cmdResumeFueling,
      cmdStopFueling,
      cmdStartFueling,
      cmdPauseFueling,
      setDispenserNozzle,
      selectedNozzle,
    } = useDispenserControl(dispenser.id!);

    // Auto-select first nozzle if none is selected
    useEffect(() => {
      if (!selectedNozzle && dispenser.nozzles.length > 0 && !fuelingOrder) {
        setDispenserNozzle(dispenser.nozzles[0]);
      }
    }, [
      selectedNozzle,
      dispenser.nozzles,
      dispenser.id,
      setDispenserNozzle,
      fuelingOrder,
    ]);

    // Active order ID comes from the hook

    // Memoize control button callbacks to prevent unnecessary re-renders
    const controlButtonCallbacks = useMemo(
      () => ({
        cmdResumeFueling,
        cmdPauseFueling,
        cmdStopFueling,
        cmdStartFueling,
        openOrdersSheet,
        closeFueling,
        handleOpenHistory,
      }),
      [
        cmdResumeFueling,
        cmdPauseFueling,
        cmdStopFueling,
        cmdStartFueling,
        openOrdersSheet,
        closeFueling,
        handleOpenHistory,
      ]
    );

    // // Track if user is actively interacting with Select to prevent state resets
    const isUserInteracting = useRef(false);

    // // Get dispenser activity status from store
    const isActive = useMemo(() => {
      if (dispenser.id == null) return false;
      // Use the reactive communication status value
      return communicationStatus === true;
    }, [dispenser.id, communicationStatus]);

    const dispenserState = useMemo(() => {
      if (!dispenser) return null;
      return {
        id: dispenser.id,
        status: isActive ? "active" : "inactive",
        state: dispenser.state,
      };
    }, [dispenser, isActive]);

    // Memoized dispenser status calculations
    const dispenserStatus = useMemo(() => {
      // Calculate severity directly from state values instead of relying on function reference
      const { pause, start, nozzle_down } = dispenser.fueling_state || {};
      let severity:
        | "danger"
        | "success"
        | "info"
        | "warning"
        | "secondary"
        | "contrast"
        | undefined;

      if (!dispenser) {
        severity = "warning";
      } else if (pause) {
        severity = "danger";
      } else if (start) {
        severity = "success";
      } else if (nozzle_down) {
        severity = "info";
      } else {
        severity = "warning";
      }

      const isOnline = isActive;
      const isFueling = dispenser.fueling_state?.start;
      const isPaused = dispenser.fueling_state?.pause;
      const nozzleDown = dispenser.fueling_state?.nozzle_down;

      return {
        severity,
        isOnline,
        isFueling,
        isPaused,
        nozzleDown,
        displayStatus: isFueling
          ? isPaused
            ? "paused"
            : "fueling"
          : isOnline
            ? "ready"
            : "offline",
      };
    }, [isActive, dispenser.fueling_state, dispenser]);

    // Memoized badge variant calculation
    const badgeVariant = useMemo(():
      | "secondary"
      | "destructive"
      | "default"
      | "outline"
      | null
      | undefined => {
      if (!isActive) return "destructive";

      switch (dispenserStatus.severity) {
        case "success":
          return "default";
        case "warning":
          return "outline";
        case "danger":
          return "destructive";
        case "info":
          return "secondary";
        default:
          return "secondary";
      }
    }, [isActive, dispenserStatus.severity]);

    // Connection status indicator with simplified states
    const ConnectionStatus = memo(() => {
      const statusConfig = useMemo(() => {
        switch (commStatus) {
          case "online":
            return {
              icon: CheckCircle,
              color: "text-green-500",
              label: t("control.online", "Online"),
              tooltip: t("control.dispenser_connected", "Kolonka ulangan"),
              bgColor: "bg-green-50 dark:bg-green-950",
            };
          case "offline":
          default:
            return {
              icon: AlertCircle,
              color: "text-red-500",
              label: t("control.offline", "Offline"),
              tooltip: t("control.dispenser_offline", "Kolonka o'chiq"),
              bgColor: "bg-red-50 dark:bg-red-950",
            };
        }
      }, [commStatus]);

      const StatusIcon = statusConfig.icon;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-md ${statusConfig.bgColor}`}
              >
                <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />

                <span className={`text-xs font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{statusConfig.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    });

    const DispenserState = memo(() => {
      const statusConfig = useMemo(() => {
        switch (dispenserState?.state) {
          case "Active":
            return {
              icon: CheckCircle,
              color: "text-green-500",
              label: t("control.active", "Активно"),
              tooltip: t("control.active", "Kolonka aktiv"),
              bgColor: "bg-green-50 dark:bg-green-950",
            };
          case "Inactive":
            return {
              icon: CheckCircle,
              color: "text-grey-500",
              label: t("control.inActive", "InActive"),
              tooltip: t("control.inactive", "Kolonka o'chiq"),
              bgColor: "bg-grey-50 dark:bg-grey-950",
            };
          case "Blocked":
            return {
              icon: AlertCircle,
              color: "text-red-500",
              label: t("control.Blocked", "Blocked"),
              tooltip: t("control.blocked", "Kolonka bloklangan"),
              bgColor: "bg-red-50 dark:bg-red-950",
            };
        }
      }, [commStatus]);

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-md ${statusConfig?.bgColor}`}
              >
                {/* <StatusIcon className={`h-3 w-3 ${statusConfig?.color}`} /> */}

                <span className={`text-xs font-medium ${statusConfig?.color}`}>
                  {statusConfig?.label}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{statusConfig?.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    });

    // Enhanced State indicator with better visual feedback
    const StateIndicator = memo(() => {
      return (
        <div className="flex flex-col gap-2 w-full">
          {/* Top row with dispenser name and status */}
          <div className="flex flex-row gap-3 w-full items-center">
            <Badge
              className={`flex-1 py-2 px-3 justify-center text-sm font-medium ${commStatus === "offline" ? "animate-pulse" : ""
                }`}
              variant={badgeVariant}
            >
              <div className="flex items-center gap-2">
                {dispenserStatus.displayStatus === "fueling" && (
                  <Clock className="h-4 w-4 animate-spin" />
                )}
                {dispenserStatus.displayStatus === "paused" && (
                  <Pause className="h-4 w-4" />
                )}
                <span className="text-lg font-semibold">{dispenser.name}</span>
              </div>
            </Badge>
            <Badge
              className="flex-1 py-2 px-3 justify-center text-sm font-medium"
              variant="outline"
            >
              <div className="text-lg flex items-center gap-2">
                <span>{getStateLabel(dispenser, selectedNozzle)}</span>
                {dispenserStatus.nozzleDown ? (
                  <ArrowDown className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowUp className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </Badge>
          </div>

          {/* Bottom row with connection status, progress, and nozzle select */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex flex-col gap-2">
                  <ConnectionStatus />
                <DispenserState />

              {fuelingOrder && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Progress
                    value={Math.min(
                      fuelingOrder.preset_type === "Amount"
                        ? (fuelingOrder.amount || 0) /
                        (fuelingOrder.preset_amount || 1)
                        : ((fuelingOrder.volume || 0) /
                          (fuelingOrder.preset_volume || 1)) *
                        100,
                      100
                    )}
                    className="w-20 h-2"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                    {fuelingOrder.preset_type === "Amount"
                      ? `${(
                        fuelingOrder.preset_amount || 0
                      ).toLocaleString()} ${t("сум")}`
                      : `${(
                        fuelingOrder.preset_volume || 0
                      ).toLocaleString()} л`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <NozzleSelect />
            </div>
          </div>
        </div>
      );
    });

    // Optimized nozzle selection with better UX and stability
    const NozzleSelect = memo(() => {
      const nozzleIsUp = !dispenserStatus.nozzleDown;

      const handleNozzleChange = useCallback(
        (value: string) => {
          isUserInteracting.current = true;
          const nozzle =
            dispenser.nozzles.find(n => n.id?.toString() === value) || null;
          setDispenserNozzle(nozzle);

          // Reset interaction flag after a short delay
          setTimeout(() => {
            isUserInteracting.current = false;
          }, 500);
        },
        [dispenser.nozzles, setDispenserNozzle]
      );

      // Memoize nozzle options to prevent re-creation
      const nozzleOptions = useMemo(
        () =>
          dispenser.nozzles.map(nozzle => ({
            id: nozzle.id,
            value: nozzle.id?.toString() || "",
            name: nozzle.tank?.name || "",
            price: nozzle.tank?.product ? getSalePrice(nozzle.tank.product) : 0,
            productName: nozzle.tank?.product?.name || "",
          })),
        [dispenser.nozzles]
      );

      // Memoize selected value to prevent unnecessary re-renders
      const selectedValue = useMemo(
        () => selectedNozzle?.id?.toString() || "",
        [selectedNozzle?.id]
      );

      return (
        <Select
          value={selectedValue}
          onValueChange={handleNozzleChange}
          disabled={nozzleIsUp}
          onOpenChange={open => {
            isUserInteracting.current = open;
          }}
        >
          <SelectTrigger
            className={`w-full transition-colors text-sm ${nozzleIsUp
              ? "bg-green-500 text-white cursor-not-allowed border-green-700"
              : "hover:bg-accent"
              }`}
            style={nozzleIsUp ? { opacity: 1 } : undefined}
          >
            <SelectValue placeholder={t("control.select_nozzle")}>
              {selectedNozzle && (
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-sm leading-tight">
                      {selectedNozzle.tank?.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs opacity-80">
                      <span>
                        {selectedNozzle.tank?.product
                          ? getSalePrice(selectedNozzle.tank.product)
                          : 0}{" "}
                        {t("сум")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {nozzleOptions.map(option => (
              <SelectItem
                key={option.id}
                value={option.value}
                className="cursor-pointer py-3"
              >
                <div className="flex flex-col gap-1 w-full">
                  <span className="font-medium text-sm">{option.name}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">
                      {option.price} {t("сум")}
                    </span>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {option.productName}
                    </Badge>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    });

    // Enhanced fueling form with better layout
    const FuelingForm = memo(() => (
      <div className="flex flex-row gap-3 w-full">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="fueling-volume" className="text-sm font-medium">
            {t("control.volume", { volume: "мк" })}
          </Label>
          <NumericInput
            value={fuelingOrder?.volume ?? 0}
            readOnly={true}
            suffix="л"
            placeholder="0"
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="fueling-amount" className="text-sm font-medium">
            {t("control.amount", { amount: "сум" })}
          </Label>
          <NumericInput
            value={fuelingOrder?.amount ?? 0}
            readOnly={true}
            suffix={t("сум")}
            placeholder="0"
          />
        </div>
      </div>
    ));

    // Dynamic content based on state
    const centerContent = useMemo(() => {
      return fuelingOrder ? (
        <FuelingForm />
      ) : (
        <PresetForm
          dispenser={dispenser}
          selectedNozzle={selectedNozzle}
          setPreset={setPreset}
          onStartFueling={cmdStartFueling} // Add this line
        />
      );
    }, [fuelingOrder, dispenser, selectedNozzle, setPreset, cmdStartFueling]); // Add cmdStartFueling to dependencies

    // Removed test logging

    return (
      <Card
        className={`

                p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300
                flex flex-col gap-5 items-center w-full max-w-md mx-auto
                border-2
                ${!isActive
            ? "opacity-70 border-red-300"
            : "border-gray-200"
          }
                ${dispenserStatus.isFueling
            ? "ring-2 ring-blue-500/30 border-blue-400"
            : ""
          }
                ${dispenserStatus.isPaused
            ? "ring-2 ring-amber-500/30 border-amber-400 bg-gradient-to-br from-amber-50/50 to-amber-100/30"
            : ""
          }
            `}
      >
        {/* Header with state indicator */}
        <div className="flex flex-col items-center gap-3 w-full">
          <StateIndicator />
        </div>

        {/* Main content area */}
        <div className="w-full">{centerContent}</div>

        {/* Control buttons */}
        <div className="flex flex-row gap-2 w-full justify-center">
          <ControlButtons
            dispenser={dispenser}
            isActive={isActive}
            activeOrderId={activeOrderId}
            fuelingOrder={fuelingOrder}
            {...controlButtonCallbacks}
          />
        </div>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    // Only re-render if the dispenser ID changes or the handleOpenHistory function changes
    if (prevProps.dispenser.id !== nextProps.dispenser.id) {
      return false; // Re-render if dispenser ID changed
    }

    if (prevProps.handleOpenHistory !== nextProps.handleOpenHistory) {
      return false; // Re-render if callback changed
    }

    // Compare critical dispenser properties that affect rendering
    const prevDispenser = prevProps.dispenser;
    const nextDispenser = nextProps.dispenser;

    // Compare basic properties
    if (
      prevDispenser.name !== nextDispenser.name ||
      prevDispenser.base_address !== nextDispenser.base_address ||
      prevDispenser.selected_nozzle_id !== nextDispenser.selected_nozzle_id
    ) {
      return false;
    }

    // Compare fueling state - critical for control buttons and status updates
    const prevFuelingState = prevDispenser.fueling_state;
    const nextFuelingState = nextDispenser.fueling_state;

    if (
      prevFuelingState?.start !== nextFuelingState?.start ||
      prevFuelingState?.pause !== nextFuelingState?.pause ||
      prevFuelingState?.nozzle_down !== nextFuelingState?.nozzle_down ||
      prevFuelingState?.card !== nextFuelingState?.card ||
      prevFuelingState?.kb_control !== nextFuelingState?.kb_control ||
      prevFuelingState?.kb_preset !== nextFuelingState?.kb_preset ||
      prevFuelingState?.is_error !== nextFuelingState?.is_error
    ) {
      return false;
    }

    // Compare dispenser state
    if (prevDispenser.state !== nextDispenser.state) {
      return false;
    }

    // Compare error state
    if (prevDispenser.error !== nextDispenser.error) {
      return false;
    }

    // Compare nozzles array length and basic properties
    if (prevDispenser.nozzles.length !== nextDispenser.nozzles.length) {
      return false;
    }

    // Deep compare nozzles for essential properties
    for (let i = 0; i < prevDispenser.nozzles.length; i++) {
      const prevNozzle = prevDispenser.nozzles[i];
      const nextNozzle = nextDispenser.nozzles[i];

      // Compare active sale price instead of first price in array
      const prevPrice = prevNozzle.tank?.product
        ? getSalePrice(prevNozzle.tank.product)
        : 0;
      const nextPrice = nextNozzle.tank?.product
        ? getSalePrice(nextNozzle.tank.product)
        : 0;

      if (
        prevNozzle.id !== nextNozzle.id ||
        prevNozzle.address !== nextNozzle.address ||
        prevNozzle.tank?.id !== nextNozzle.tank?.id ||
        prevPrice !== nextPrice
      ) {
        return false;
      }
    }

    // If all comparisons pass, don't re-render
    return true;
  }
);
