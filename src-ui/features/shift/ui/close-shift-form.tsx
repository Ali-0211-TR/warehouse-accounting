import { useUserStore } from "@/entities/user";
import { ShiftDTO } from "@/shared/bindings/dtos/ShiftDTO";
import { ShiftData } from "@/shared/bindings/ShiftData";
import { ShiftEntity } from "@/shared/bindings/ShiftEntity";
import { Alert, AlertDescription } from "@/shared/ui/shadcn/alert";
import { Button } from "@/shared/ui/shadcn/button";
import { AlertTriangle, Clock, XCircle } from "lucide-react";
import { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState<ShiftData[]>([]);
  const { currentUser } = useUserStore();

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
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData([]);
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
