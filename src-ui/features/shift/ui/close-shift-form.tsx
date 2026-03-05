import { dispenserApi, useDispenserStore } from "@/entities/dispenser";
import { useTankStore } from "@/entities/tank";
import { useUserStore } from "@/entities/user";
import { ShiftDTO } from "@/shared/bindings/dtos/ShiftDTO";
import { ShiftData } from "@/shared/bindings/ShiftData";
import { ShiftDispenserData } from "@/shared/bindings/ShiftDispenserData";
import { ShiftEntity } from "@/shared/bindings/ShiftEntity";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription } from "@/shared/ui/shadcn/alert";
import { Button } from "@/shared/ui/shadcn/button";
import { AlertTriangle, Clock, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShiftDataTable } from "./shift-data-table";

// Helper function to shorten UUID for display (last 8 characters)
const shortenShiftId = (shiftId: string): string => {
  if (!shiftId || shiftId.length <= 8) return shiftId;
  return shiftId.slice(-8);
};

interface CloseShiftFormProps {
  open: boolean;
  onClose: () => void;
  shift: ShiftEntity | null;
  onSubmit: (data: ShiftDTO) => Promise<void>;
}

export function CloseShiftForm({
  open,
  onClose,
  shift,
  onSubmit,
}: CloseShiftFormProps) {
  const { t } = useTranslation();
  const { tanks, loadTanks } = useTankStore();
  const { dispensers, getTotalByAddress } = useDispenserStore();
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editData, setEditData] = useState<ShiftData[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { currentUser } = useUserStore();

  // Update dispensers_data from received totals
  const updateDispenserDataFromTotals = useCallback(() => {
    setEditData(currentData => {
      if (currentData.length === 0) return currentData;

      const updatedData = currentData.map((tankData, index) => {
        const dispensersData: ShiftDispenserData[] = [];
        const currentTank = tanks[index]; // Get tank by index since number is sequential

        dispensers.forEach(dispenser => {
          dispenser.nozzles.forEach(nozzle => {
            // Check if this nozzle belongs to this tank
            if (currentTank && nozzle.tank?.id === currentTank.id) {
              const totalData = getTotalByAddress(nozzle.address);

              if (totalData) {
                dispensersData.push({
                  dispenser_name: dispenser.name || `Dispenser ${dispenser.id}`,
                  nozzle_addres: nozzle.address.toString(),
                  shift_volume: totalData.shiftVolume || 0,
                  shift_amount: totalData.shiftAmount || 0,
                  total_volume: totalData.totalVolume || 0,
                  total_amount: totalData.totalAmount || 0,
                  calc_volume: totalData.totalVolume || 0,
                  calc_amount: totalData.totalAmount || 0,
                });
              }
            }
          });
        });

        return {
          ...tankData,
          dispensers_data: dispensersData,
        };
      });

      return updatedData;
    });
  }, [dispensers, getTotalByAddress, tanks]);

  // Read totals from all dispensers - similar to FuelMovementsReportPage
  const readAllTotals = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const promises: Promise<any>[] = [];
      let commandCount = 0;

      dispensers.forEach(dispenser => {
        dispenser.nozzles.forEach(nozzle => {
          promises.push(
            dispenserApi
              .readTotal(nozzle.address)
              .then(() => ({ address: nozzle.address, type: "total" }))
              .catch(error => {
                console.error(
                  `ReadTotal failed for nozzle ${nozzle.address}:`,
                  error
                );
                throw error;
              })
          );

          promises.push(
            dispenserApi
              .readShiftTotal(nozzle.address)
              .then(() => ({ address: nozzle.address, type: "shift" }))
              .catch(error => {
                console.error(
                  `ReadShiftTotal failed for nozzle ${nozzle.address}:`,
                  error
                );
                throw error;
              })
          );

          commandCount += 2;
        });
      });

      const results = await Promise.allSettled(promises);
      const failed = results.filter(r => r.status === "rejected").length;

      if (failed > 0) {
      } else {
      }

      // Wait a bit for responses to arrive
      setTimeout(() => {
        updateDispenserDataFromTotals();
      }, 2000);
    } catch (error: any) {
      console.error("Error reading totals:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispensers, updateDispenserDataFromTotals]);

  useEffect(() => {
    async function loadData() {
      if (open && shift && !shift.d_close && !dataLoaded) {
        try {
          await loadTanks();
          setDataLoaded(true);
        } catch (error) {
          console.error("Failed to load tanks:", error);
        }
      }
    }

    if (open) {
      loadData();
    } else {
      // Reset when dialog closes
      setDataLoaded(false);
      setEditData([]);
    }
  }, [open, shift, loadTanks, dataLoaded]);

  // Separate effect to initialize data when tanks are loaded
  useEffect(() => {
    if (
      open &&
      shift &&
      !shift.d_close &&
      dataLoaded &&
      tanks.length > 0 &&
      editData.length === 0
    ) {
      const initialData: ShiftData[] = tanks.map((tank, index) => ({
        number: index + 1, // Use sequential tank number (1, 2, 3...)
        gas: tank.name,
        temperature: 0, // Default temperature
        density: 0, // Default density
        level_current: 0,
        volume_current: 0,
        level_water: 0,
        volume_water: 0,
        volume_gas_calc: Number(tank.balance) || 0,
        volume_gas_measure: 0,
        level_measure: 0,
        level_water_measure: 0,
        volume_gas_corr: 0,
        dispensers_data: [],
      }));
      setEditData(initialData);

      // Auto-read totals after data initialization
      if (dispensers.length > 0) {
        setTimeout(() => {
          readAllTotals();
        }, 1000);
      }
    }
  }, [
    open,
    shift,
    dataLoaded,
    tanks,
    editData.length,
    dispensers.length,
    readAllTotals,
  ]);

  const handleDataChange = (data: ShiftData[]) => {
    setEditData(data);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data: ShiftDTO = {
        data: editData,
      };
      await onSubmit(data);
      setEditData([]);
      setDataLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData([]);
    setDataLoaded(false);
    onClose();
  };

  const getHeader = () => {
    if (shift) {
      if (shift.d_close) {
        return `${t("shift.shift_view")}: #${shift.id ? shortenShiftId(shift.id) : ""}`;
      }
      return `${t("shift.close_shift")}: #${shift.id ? shortenShiftId(shift.id) : ""}`;
    }
    return t("shift.close_shift");
  };

  const isViewMode = shift?.d_close !== null && shift?.d_close !== undefined;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Header */}
          <div className="flex flex-row items-center justify-between p-6 pb-4 border-b shrink-0">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold">{getHeader()}</h2>
            </div>
            <div className="flex items-center gap-2">
              {!isViewMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={readAllTotals}
                  disabled={loading || isRefreshing}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                  />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={loading}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isViewMode && (
            <div className="p-6 pt-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {t("shift.close_shift_warning", {
                    id: shift?.id ? `#${shortenShiftId(shift.id)}` : ""
                  })}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex-1 overflow-hidden px-6">
            {isViewMode ? (
              // View mode - show both opening and closing data
              <div className="space-y-6 h-full overflow-y-auto">
                <ShiftDataTable
                  data={shift.data_open || []}
                  editable={false}
                  title={t("shift.opening_readings")}
                />
                {shift.data_close && (
                  <ShiftDataTable
                    data={shift.data_close}
                    editable={false}
                    title={t("shift.closing_readings")}
                  />
                )}
              </div>
            ) : (
              // Edit mode - show editable closing data
              <ShiftDataTable
                data={editData}
                editable={true}
                onChange={handleDataChange}
                title={`${t("shift.current_shift")}: ${
                  currentUser?.full_name || t("shift.unknown_user")
                }`}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 p-6 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              {t("control.close")}
            </Button>
            {!isViewMode && (
              <Button
                onClick={handleSubmit}
                disabled={loading || editData.length === 0}
                variant="destructive"
              >
                {loading ? t("control.loading") : t("shift.close_shift")}
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
