import type { FiltersFormValues } from "../model/use-fuel-movements-data";
import type { ShiftEntity } from "@/entities/shift";
import type { DateFilterMode, DateRange } from "@/features/shift/model/use-date-filter";
import { DateFilterSelector } from "@/entities/shift/ui/DateFilterSelector";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/shadcn/form";
import { Input } from "@/shared/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import { RefreshCw, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UseFormReturn } from "react-hook-form";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<FiltersFormValues>;
  dateFilter: {
    mode: DateFilterMode;
    handleModeChange: (mode: DateFilterMode) => void;
    selectedShift: ShiftEntity | null;
    handleShiftSelect: (shift: ShiftEntity | null) => void;
    dateRange: DateRange | undefined;
    handleDateRangeSelect: (range: DateRange | undefined) => void;
  };
  shifts: ShiftEntity[];
  uniqueDispensers: string[];
  uniqueTanks: string[];
  isLoadingSummary: boolean;
  hasActiveFilters: boolean;
  onSubmit: (values: FiltersFormValues) => void;
  onClear: () => void;
}

export function FuelMovementsFilterDialog({
  open,
  onOpenChange,
  form,
  dateFilter,
  shifts,
  uniqueDispensers,
  uniqueTanks,
  isLoadingSummary,
  hasActiveFilters,
  onSubmit,
  onClear,
}: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle>{t("fuel_movements.filters")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 px-2 sm:px-0"
          >
            {/* Date / Shift filter */}
            <DateFilterSelector
              mode={dateFilter.mode}
              onModeChange={dateFilter.handleModeChange}
              selectedShift={dateFilter.selectedShift}
              onShiftSelect={dateFilter.handleShiftSelect}
              shifts={shifts}
              dateRange={dateFilter.dateRange}
              onDateRangeChange={dateFilter.handleDateRangeSelect}
            />

            {/* Other filters grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Dispenser */}
              <FormField
                control={form.control}
                name="dispenserFilter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fuel_movements.select_dispenser")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("fuel_movements.all_dispensers")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">{t("fuel_movements.all_dispensers")}</SelectItem>
                        {uniqueDispensers.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tank */}
              <FormField
                control={form.control}
                name="tankFilter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fuel_movements.tank")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("fuel_movements.all_tanks")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">{t("fuel_movements.all_tanks")}</SelectItem>
                        {uniqueTanks.map((tank) => (
                          <SelectItem key={tank} value={tank}>
                            {tank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Search */}
              <FormField
                control={form.control}
                name="searchTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("control.search")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("fuel_movements.search_by_name_or_id")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-2 flex-wrap">
              <Button type="submit" disabled={isLoadingSummary}>
                {isLoadingSummary ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {t("control.loading")}
                  </>
                ) : (
                  t("control.apply")
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-600 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    onClear();
                    onOpenChange(false);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  {t("control.clear_filters")}
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t("control.cancel")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
