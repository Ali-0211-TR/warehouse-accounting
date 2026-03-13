import { ShiftData } from "@/shared/bindings/ShiftData";
import { Input } from "@/shared/ui/shadcn/input";
import {
  Droplets,
  Gauge,
  Thermometer,
} from "lucide-react";
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

  const handleInputChange = (
    rowIdx: number,
    field: keyof ShiftData,
    value: number
  ) => {
    if (!editable || !onChange) return;

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
                    {row.number}
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
