import { dispenserApi, useDispenserStore } from "@/entities/dispenser";
import { useTankStore } from "@/entities/tank";
import { useUserStore } from "@/entities/user";
import { ShiftDTO } from "@/shared/bindings/dtos/ShiftDTO";
import { ShiftData } from "@/shared/bindings/ShiftData";
import { ShiftDispenserData } from "@/shared/bindings/ShiftDispenserData";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription } from "@/shared/ui/shadcn/alert";
import { Button } from "@/shared/ui/shadcn/button";
import { AlertTriangle, Clock, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShiftDataTable } from "./shift-data-table";

interface OpenShiftFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ShiftDTO) => Promise<void>;
}

export function OpenShiftForm({ open, onClose, onSubmit }: OpenShiftFormProps) {
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

  // First effect: Load tanks when dialog opens
  useEffect(() => {
    async function loadData() {
      if (open && !dataLoaded) {
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
  }, [open, loadTanks, dataLoaded]);

  // Second effect: Initialize data when tanks are loaded
  useEffect(() => {
    if (open && dataLoaded && tanks.length > 0 && editData.length === 0) {
      const initialData: ShiftData[] = tanks.map((tank, index) => {
        // Get dispensers_data for this tank from current totals
        const dispensersData: ShiftDispenserData[] = [];

        dispensers.forEach(dispenser => {
          dispenser.nozzles.forEach(nozzle => {
            // Check if this nozzle belongs to the current tank
            if (nozzle.tank?.id === tank.id) {
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
          number: index + 1, // Use sequential tank number (1, 2, 3...)
          gas: tank.name,
          temperature: 0, // Default temperature
          density: 0.0, // Default density
          level_current: 0,
          volume_current: 0,
          level_water: 0,
          volume_water: 0,
          volume_gas_calc: Number(tank.balance) || 0,
          volume_gas_measure: 0,
          level_measure: 0,
          level_water_measure: 0,
          volume_gas_corr: 0,
          dispensers_data: dispensersData,
        };
      });

      setEditData(initialData);

      // Auto-read totals after data initialization to refresh with latest data
      if (dispensers.length > 0) {
        setTimeout(() => {
          readAllTotals();
        }, 1000);
      }
    }
  }, [
    open,
    dataLoaded,
    tanks,
    editData.length,
    dispensers.length,
    readAllTotals,
    getTotalByAddress,
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

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Header */}
          <div className="flex flex-row items-center justify-between p-6 pb-4 border-b shrink-0">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold">{t("shift.open_shift")}</h2>
            </div>
            <div className="flex items-center gap-2">
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

          <div className="p-6 pt-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                {t("shift.open_shift_warning")}
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex-1 overflow-hidden px-6">
            <ShiftDataTable
              data={editData}
              editable={true}
              onChange={handleDataChange}
              title={`${t("shift.current_shift")}: ${currentUser?.full_name || t("shift.unknown_user")
                }`}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 p-6 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              {t("control.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || editData.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? t("control.loading") : t("shift.open_shift")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
