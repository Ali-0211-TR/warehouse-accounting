import { useUserStore } from "@/entities/user";
import { ShiftDTO } from "@/shared/bindings/dtos/ShiftDTO";
import { ShiftData } from "@/shared/bindings/ShiftData";
import { Alert, AlertDescription } from "@/shared/ui/shadcn/alert";
import { Button } from "@/shared/ui/shadcn/button";
import { AlertTriangle, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShiftDataTable } from "./shift-data-table";

interface OpenShiftFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ShiftDTO) => Promise<void>;
}

export function OpenShiftForm({ open, onClose, onSubmit }: OpenShiftFormProps) {
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
