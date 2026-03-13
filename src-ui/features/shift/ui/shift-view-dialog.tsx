import type { ShiftData, ShiftEntity } from "@/entities/shift";
import { ShiftDataActions } from "./ShiftDataActions";
import { ShiftFinancialSummary } from "./ShiftFinancialSummary";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import { Separator } from "@/shared/ui/shadcn/separator";
import { format } from "date-fns";
import { t } from "i18next";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Droplets,
  Gauge,
  Thermometer,
  User,
  XCircle,
} from "lucide-react";
// Helper function to shorten UUID for display (last 8 characters)
const shortenShiftId = (shiftId: string): string => {
  if (!shiftId || shiftId.length <= 8) return shiftId;
  return shiftId.slice(-8);
};

interface ShiftViewDialogProps {
  open: boolean;
  onClose: () => void;
  shift: ShiftEntity | null;
}

export function ShiftViewDialog({
  open,
  onClose,
  shift,
}: ShiftViewDialogProps) {
  if (!shift) return null;

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), "dd.MM.yyyy HH:mm:ss");
  };

  const calculateDuration = (): string => {
    if (!shift.d_close) return t("shift.ongoing");

    const start = new Date(shift.d_open);
    const end = new Date(shift.d_close);
    const diff = end.getTime() - start.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}ч ${minutes}м`;
  };

  const renderShiftData = (data: ShiftData[], title: string) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          {t("shift.no_data_available")}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </h4>

        {/* Tank Data Table */}
        <div className="space-y-4">
          <h5 className="font-medium text-base flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-600" />
            {t("shift.tank_data")}
          </h5>
          <div className="overflow-x-auto border rounded-lg">
            <table className="data-table w-full border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border p-3 text-left font-medium">
                    {t("shift_data.number")}
                  </th>
                  <th className="border p-3 text-left font-medium">
                    {t("shift_data.gas")}
                  </th>
                  <th className="border p-3 text-left font-medium">
                    {t("shift_data.temperature")}
                  </th>
                  <th className="border p-3 text-left font-medium">
                    {t("shift_data.density")}
                  </th>
                  <th className="border p-3 text-left font-medium">
                    {t("shift_data.level_current")}
                  </th>
                  <th className="border p-3 text-left font-medium">
                    {t("shift_data.volume_current")}
                  </th>
                  <th className="border p-3 text-left font-medium">
                    {t("shift_data.level_water")}
                  </th>
                  <th className="border p-3 text-left font-medium">
                    {t("shift_data.volume_water")}
                  </th>
                  <th className="border p-3 text-left font-medium">
                    {t("shift_data.level_measure")}
                  </th>
                  <th className="border p-3 text-left font-medium">
                    {t("shift_data.level_water_measure")}
                  </th>
                  <th className="border p-3 text-left font-medium">
                    {t("shift_data.volume_gas_calc")}
                  </th>
                  <th className="border p-3 text-left font-medium">
                    {t("shift_data.volume_gas_measure")}
                  </th>
                  <th className="border p-3 text-left font-medium">
                    {t("shift_data.volume_gas_corr")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="border p-3 text-center font-mono font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">
                      {item.number}
                    </td>
                    <td className="border p-3 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{item.gas}</td>
                    <td className="border p-3 text-right whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                      <div className="flex items-center justify-end gap-2">
                        <Thermometer className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <span className="font-mono truncate">
                          {item.temperature.toFixed(1)}°C
                        </span>
                      </div>
                    </td>
                    <td className="border p-3 text-right whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                      <div className="flex items-center justify-end gap-2">
                        <Gauge className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="font-mono truncate">
                          {item.density.toFixed(3)}
                        </span>
                      </div>
                    </td>
                    <td className="border p-3 text-right font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                      {item.level_current.toFixed(2)} {t("shift.unit.millimeter")}
                    </td>
                    <td className="border p-3 text-right whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                      <div className="flex items-center justify-end gap-2">
                        <Droplets className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="font-mono truncate">
                          {item.volume_current.toFixed(2)} {t("shift.unit.liter")}
                        </span>
                      </div>
                    </td>
                    <td className="border p-3 text-right font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                      {item.level_water.toFixed(2)} {t("shift.unit.millimeter")}
                    </td>
                    <td className="border p-3 text-right whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                      <div className="flex items-center justify-end gap-2">
                        <Droplets className="h-4 w-4 text-red-400 flex-shrink-0" />
                        <span className="font-mono truncate">
                          {item.volume_water.toFixed(2)} {t("shift.unit.liter")}
                        </span>
                      </div>
                    </td>
                    <td className="border p-3 text-right font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                      {item.level_measure.toFixed(2)} {t("shift.unit.millimeter")}
                    </td>
                    <td className="border p-3 text-right font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                      {item.level_water_measure.toFixed(2)} {t("shift.unit.millimeter")}
                    </td>
                    <td className="border p-3 text-right whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                      <div className="flex items-center justify-end gap-2">
                        <Droplets className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="font-mono truncate">
                          {item.volume_gas_calc.toFixed(2)} {t("shift.unit.liter")}
                        </span>
                      </div>
                    </td>
                    <td className="border p-3 text-right whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                      <div className="flex items-center justify-end gap-2">
                        <Droplets className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="font-mono truncate">
                          {item.volume_gas_measure.toFixed(2)} {t("shift.unit.liter")}
                        </span>
                      </div>
                    </td>
                    <td className="border p-3 text-right whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                      <div className="flex items-center justify-end gap-2">
                        <Droplets className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        <span className="font-mono truncate">
                          {item.volume_gas_corr.toFixed(2)} {t("shift.unit.liter")}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


      </div>
    );
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Header */}
          <div className="flex flex-row items-center justify-between p-6 pb-4 border-b shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <h2 className="text-lg font-semibold">
                {t("shift.shift_details")} #{shift.id ? shortenShiftId(shift.id) : ""}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                {t("control.print")}
              </Button> */}
              {/* Кнопки экспорта и печати */}
              <ShiftDataActions
                data={[shift]}
                // disabled={loading}
              />
              <Button variant="outline" size="sm" onClick={onClose}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            id="shift-print-content"
            className="flex-1 overflow-y-auto overflow-x-auto p-2 space-y-2"
          >
            {/* Header for print */}
            <div className="header hidden print:block">
              <h1>
                {t("shift.shift_report")} #{shift.id ? shortenShiftId(shift.id) : ""}
              </h1>
              <p>
                {t("shift.generated_at")}:{" "}
                {format(new Date(), "dd.MM.yyyy HH:mm:ss")}
              </p>
            </div>

            {/* Basic Information */}
            <Card>
              {/* <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {t('shift.basic_information')}
                            </CardTitle>
                        </CardHeader> */}

              <CardContent>
                <div className="info-grid grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="info-item">
                      <span className="info-label font-medium">
                        {t("shift.id")}:
                      </span>
                      <span className="ml-2 font-mono">
                        #{shift.id ? shortenShiftId(shift.id) : ""}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label font-medium">
                        {t("shift.user_open")}:
                      </span>
                      <div className="ml-2 flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600" />
                        <span>
                          {shift.user_open?.full_name || t("common.unknown")}
                        </span>
                      </div>
                    </div>
                    <div className="info-item">
                      <span className="info-label font-medium">
                        {t("shift.d_open")}:
                      </span>
                      <div className="ml-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span>{formatDateTime(shift.d_open)}</span>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-1 xl:hidden" />
                  <div className="space-y-1">
                    <div className="info-item">
                      <span className="info-label font-medium">
                        {t("shift.status")}:
                      </span>
                      <Badge
                        variant={shift.d_close ? "default" : "secondary"}
                        className={`ml-2 ${shift.d_close
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-green-50 text-green-700 border-green-200"
                          }`}
                      >
                        <div className="flex items-center space-x-1">
                          {shift.d_close ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          <span>
                            {t(
                              shift.d_close
                                ? "shift.status_closed"
                                : "shift.status_open"
                            )}
                          </span>
                        </div>
                      </Badge>
                    </div>
                    <div className="info-item">
                      <span className="info-label font-medium">
                        {t("shift.user_close")}:
                      </span>
                      {shift.user_close ? (
                        <div className="ml-2 flex items-center gap-2">
                          <User className="h-4 w-4 text-red-600" />
                          <span>{shift.user_close.full_name}</span>
                        </div>
                      ) : (
                        <span className="ml-2 text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="info-item">
                      <span className="info-label font-medium">
                        {t("shift.d_close")}:
                      </span>
                      {shift.d_close ? (
                        <div className="ml-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-red-600" />
                          <span>{formatDateTime(shift.d_close)}</span>
                        </div>
                      ) : (
                        <span className="ml-2 text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>

                  <div className="xl:col-span-1 lg:col-span-2">
                    <Separator className="my-4 xl:hidden" />
                    <div className="info-item">
                      <span className="info-label font-medium">
                        {t("shift.duration")}:
                      </span>
                      <div className="ml-2 inline-flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">
                          {calculateDuration()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary for this shift */}
            <ShiftFinancialSummary shift={shift} />

            {/* Opening Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">
                  {t("shift.opening_data")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderShiftData(
                  shift.data_open,
                  t("shift.tank_readings_at_opening")
                )}
              </CardContent>
            </Card>

            {/* Closing Data */}
            {shift.data_close && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-700">
                    {t("shift.closing_data")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderShiftData(
                    shift.data_close,
                    t("shift.tank_readings_at_closing")
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
}
