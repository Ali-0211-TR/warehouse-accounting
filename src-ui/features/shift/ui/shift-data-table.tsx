import { ShiftData } from "@/shared/bindings/ShiftData";
import { Input } from "@/shared/ui/shadcn/input";
import { ScrollArea, ScrollBar } from "@/shared/ui/shadcn/scroll-area";
import {
  ChevronDown,
  ChevronRight,
  Droplets,
  Gauge,
  Thermometer,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ShiftDataTableProps {
  data: ShiftData[];
  editable: boolean;
  onChange?: (data: ShiftData[]) => void;
  title?: string;
}

const editableFields: (keyof ShiftData)[] = [
  "temperature",
  "density",
  "level_current",
  "volume_current",
  "level_water",
  "volume_water",
  "level_measure",
  "level_water_measure",
  "volume_gas_calc",
  "volume_gas_measure",
  "volume_gas_corr",
];

export function ShiftDataTable({
  data,
  editable,
  onChange,
  title,
}: ShiftDataTableProps) {
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (rowNumber: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowNumber)) {
      newExpanded.delete(rowNumber);
    } else {
      newExpanded.add(rowNumber);
    }
    setExpandedRows(newExpanded);
  };

  const handleInputChange = (
    rowIdx: number,
    field: keyof ShiftData,
    value: number
  ) => {
    if (!editable || !onChange) return;

    // Only allow editing of numeric fields, not dispensers_data
    if (field === "dispensers_data") return;

    const updated = [...data];
    updated[rowIdx] = { ...updated[rowIdx], [field]: value };
    onChange(updated);
  };

  const formatValue = (value: number | undefined) => {
    return value?.toFixed(2) || "0.00";
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {title && (
        <h4 className="font-semibold text-lg flex items-center gap-2">
          {title}
        </h4>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[1400px]">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="p-3 text-left font-medium border-r">
                {t("shift_data.number")}
              </th>
              <th className="p-3 text-left font-medium border-r">
                {t("shift_data.gas")}
              </th>
              <th className="p-3 text-left font-medium border-r">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  {t("shift_data.temperature")}
                </div>
              </th>
              <th className="p-3 text-left font-medium border-r">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-blue-500" />
                  {t("shift_data.density")}
                </div>
              </th>
              <th className="p-3 text-left font-medium border-r">
                {t("shift_data.level_current")}
              </th>
              <th className="p-3 text-left font-medium border-r">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-600" />
                  {t("shift_data.volume_current")}
                </div>
              </th>
              <th className="p-3 text-left font-medium border-r">
                {t("shift_data.level_water")}
              </th>
              <th className="p-3 text-left font-medium border-r">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-red-400" />
                  {t("shift_data.volume_water")}
                </div>
              </th>
              <th className="p-3 text-left font-medium border-r">
                {t("shift_data.level_measure")}
              </th>
              <th className="p-3 text-left font-medium border-r">
                {t("shift_data.level_water_measure")}
              </th>
              <th className="p-3 text-left font-medium border-r">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-green-500" />
                  {t("shift_data.volume_gas_calc")}
                </div>
              </th>
              <th className="p-3 text-left font-medium border-r">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  {t("shift_data.volume_gas_measure")}
                </div>
              </th>
              <th className="p-3 text-left font-medium">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-purple-500" />
                  {t("shift_data.volume_gas_corr")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <>
                <tr
                  key={row.number}
                  className="border-b hover:bg-muted/30 transition-colors"
                >
                  <td className="p-3 font-mono font-medium border-r">
                    <div className="flex items-center gap-2">
                      {row.dispensers_data &&
                        row.dispensers_data.length > 0 && (
                          <button
                            onClick={() => toggleRow(row.number)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            {expandedRows.has(row.number) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      {row.number}
                    </div>
                  </td>
                  <td className="p-3 border-r">{row.gas}</td>
                  {editableFields.map(field => (
                    <td className="p-3 border-r last:border-r-0" key={field}>
                      {editable ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={(row[field] as number) ?? ""}
                          onChange={e =>
                            handleInputChange(
                              rowIdx,
                              field,
                              Number(e.target.value)
                            )
                          }
                          className="w-24 text-right font-mono"
                          placeholder="0.00"
                        />
                      ) : (
                        <span className="font-mono text-right block">
                          {formatValue(row[field] as number)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Nested dispensers table */}
                {expandedRows.has(row.number) &&
                  row.dispensers_data &&
                  row.dispensers_data.length > 0 && (
                    <tr key={`${row.number}-dispensers`}>
                      <td colSpan={13} className="p-0 bg-muted/20">
                        <div className="p-4">
                          <h5 className="font-medium mb-3 text-sm text-muted-foreground">
                            {t("shift_data.dispensers_data")}
                          </h5>
                          <div className="rounded border bg-background">
                            <ScrollArea className="w-full">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[800px]">
                                  <thead>
                                    <tr className="bg-muted/30 border-b">
                                      <th className="p-2 text-left font-medium border-r text-xs">
                                        {t("shift_data.dispenser_name")}
                                      </th>
                                      <th className="p-2 text-left font-medium border-r text-xs">
                                        {t("shift_data.nozzle_address")}
                                      </th>
                                      <th className="p-2 text-right font-medium border-r text-xs">
                                        {t("shift_data.shift_volume")}
                                      </th>
                                      <th className="p-2 text-right font-medium border-r text-xs">
                                        {t("shift_data.shift_amount")}
                                      </th>
                                      <th className="p-2 text-right font-medium border-r text-xs">
                                        {t("shift_data.total_volume")}
                                      </th>
                                      <th className="p-2 text-right font-medium border-r text-xs">
                                        {t("shift_data.total_amount")}
                                      </th>
                                      <th className="p-2 text-right font-medium border-r text-xs">
                                        {t("shift_data.calc_volume")}
                                      </th>
                                      <th className="p-2 text-right font-medium text-xs">
                                        {t("shift_data.calc_amount")}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.dispensers_data.map(
                                      (dispenser, dispenserIdx) => (
                                        <tr
                                          key={dispenserIdx}
                                          className="border-b last:border-b-0 hover:bg-muted/20"
                                        >
                                          <td className="p-2 border-r font-medium">
                                            {dispenser.dispenser_name}
                                          </td>
                                          <td className="p-2 border-r font-mono">
                                            {dispenser.nozzle_addres}
                                          </td>
                                          <td className="p-2 border-r text-right font-mono">
                                            {formatValue(
                                              dispenser.shift_volume
                                            )}
                                          </td>
                                          <td className="p-2 border-r text-right font-mono">
                                            {formatValue(
                                              dispenser.shift_amount
                                            )}
                                          </td>
                                          <td className="p-2 border-r text-right font-mono">
                                            {formatValue(
                                              dispenser.total_volume
                                            )}
                                          </td>
                                          <td className="p-2 border-r text-right font-mono">
                                            {formatValue(
                                              dispenser.total_amount
                                            )}
                                          </td>
                                          <td className="p-2 border-r text-right font-mono">
                                            {formatValue(dispenser.calc_volume)}
                                          </td>
                                          <td className="p-2 text-right font-mono">
                                            {formatValue(dispenser.calc_amount)}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                              <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {(!data || data.length === 0) && (
        <div className="text-center text-muted-foreground py-8">
          {t("message.no_data")}
        </div>
      )}
    </div>
  );
}
