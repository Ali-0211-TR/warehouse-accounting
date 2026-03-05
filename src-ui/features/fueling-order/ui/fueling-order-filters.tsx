import { fuelingOrderFilterSchema } from "@/entities/fueling-order/model/schemas";
import { DateFilterSelector } from "@/entities/shift/ui/DateFilterSelector";
import { useShiftStore } from "@/entities/shift";
import { useDispenser } from "@/features/dispenser";
import { useDateFilter } from "@/features/shift/model/use-date-filter";
import {
  getFuelingTypeOptions,
  getPresetTypeOptions,
} from "@/shared/const/lists";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import z from "zod";
import { useFuelingOrder } from "../model/use-fueling-order";
import { convertDateRangeToISO } from "@/shared/utils/date";



const convertISOToDateRange = (isoRange: [string, string] | null) => {
  if (!isoRange) return undefined;
  return {
    from: isoRange[0]?.split("T")[0] || isoRange[0],
    to: isoRange[1]?.split("T")[0] || isoRange[1],
  };
};

interface FuelOrderFiltersProps {
  open: boolean;
  onClose: () => void;
}

export function FuelOrderFilters({ open, onClose }: FuelOrderFiltersProps) {
  const { t } = useTranslation();
  const fuelingTypeOptions = getFuelingTypeOptions();
  const presetTypeOptions = getPresetTypeOptions();
  const { dispensers } = useDispenser();
  const { shifts, loadShifts } = useShiftStore();

  const { setFilters, clearFilter, query } = useFuelingOrder();

  // Get all nozzles from all dispensers
  const allNozzles = dispensers.flatMap(dispenser =>
    dispenser.nozzles.map(nozzle => ({
      id: nozzle.id,
      label: `${dispenser.name} - ${nozzle.tank?.name || "Tank"} (${nozzle.address
        })`,
      dispenserName: dispenser.name,
      tankName: nozzle.tank?.name || "Tank",
      address: nozzle.address,
    }))
  );

  const form = useForm<z.infer<typeof fuelingOrderFilterSchema>>({
    resolver: zodResolver(fuelingOrderFilterSchema),
    defaultValues: {
      search: "",
      id: query.filters.id ?? undefined,
      orderItemId: query.filters.order_item_id ?? undefined,
      nozzleId: query.filters.nozzle_id ? query.filters.nozzle_id : "all",
      fuelingType: query.filters.fueling_type ?? "all",
      presetType: query.filters.preset_type ?? "all",
      title: query.filters.title ?? "",
      createdDateRange: convertISOToDateRange(query.filters.d_created),
      moveDateRange: convertISOToDateRange(query.filters.d_move),
    },
  });

  // Date filters for created and move dates
  const createdDateFilter = useDateFilter({
    initialMode: "shift",
    onShiftChange: (_shift, range) => {
      if (range) {
        form.setValue("createdDateRange", range);
      } else {
        form.setValue("createdDateRange", null);
      }
    },
    onDateRangeChange: (range) => {
      form.setValue("createdDateRange", range || null);
    },
  });

  const moveDateFilter = useDateFilter({
    initialMode: "shift",
    onShiftChange: (_shift, range) => {
      if (range) {
        form.setValue("moveDateRange", range);
      } else {
        form.setValue("moveDateRange", null);
      }
    },
    onDateRangeChange: (range) => {
      form.setValue("moveDateRange", range || null);
    },
  });

  // Load shifts
  useEffect(() => {
    if (open) {
      loadShifts();
    }
  }, [open, loadShifts]);

  // Update form when query filters change
  useEffect(() => {
    form.reset({
      search: "",
      id: query.filters.id ?? undefined,
      orderItemId: query.filters.order_item_id ?? undefined,
      nozzleId: query.filters.nozzle_id ? query.filters.nozzle_id : "all",
      fuelingType: query.filters.fueling_type ?? "all",
      presetType: query.filters.preset_type ?? "all",
      title: query.filters.title ?? "",
      createdDateRange: convertISOToDateRange(query.filters.d_created),
      moveDateRange: convertISOToDateRange(query.filters.d_move),
    });
  }, [query.filters, form]);

  function onSubmit(values: z.infer<typeof fuelingOrderFilterSchema>) {
    setFilters({
      id: values.id || null,
      order_item_id: values.orderItemId || null,
      nozzle_id:
        values.nozzleId === "all"
          ? null
          : typeof values.nozzleId === "string"
            ? values.nozzleId
            : null,
      fueling_type:
        values.fuelingType === "all" ? null : values.fuelingType || null,
      preset_type:
        values.presetType === "all" ? null : values.presetType || null,
      title: values.title || null,
      d_created: convertDateRangeToISO(values.createdDateRange),
      d_move: convertDateRangeToISO(values.moveDateRange),
    });
    onClose();
  }

  async function resetFilter() {
    await clearFilter();
    createdDateFilter.reset();
    moveDateFilter.reset();
    // Form will be reset automatically by the useEffect above when query.filters change
    onClose(); // Close dialog after reset - user wants clean slate
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[min(520px,calc(100vw-1.5rem))] max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>{t("control.filters")}</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-4 overflow-y-auto max-h-[calc(85vh-120px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fueling_order.title")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("fueling_order.enter_title")}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fueling_order.fueling_order_id")}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={t("fueling_order.enter_fueling_order_id")}
                        {...field}
                        value={field.value || ""}
                        onChange={e => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderItemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fueling_order.order_item_id")}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={t("fueling_order.enter_order_item_id")}
                        {...field}
                        value={field.value || ""}
                        onChange={e => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nozzleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fueling_order.nozzle")}</FormLabel>
                    <Select
                      value={field.value?.toString() || "all"}
                      onValueChange={value =>
                        field.onChange(value === "all" ? "all" : value || null)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t("fueling_order.select_nozzle")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        {allNozzles.map(nozzle => (
                          <SelectItem
                            key={nozzle.id}
                            value={nozzle.id?.toString() || ""}
                          >
                            {nozzle.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuelingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fueling_order.fueling_type")}</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={value => field.onChange(value || null)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t("fueling_order.select_fueling_type")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        {fuelingTypeOptions.map(option => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="presetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fueling_order.preset_type")}</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={value => field.onChange(value || null)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t("fueling_order.select_preset_type")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        {presetTypeOptions.map(option => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Created Date Filter */}
              <DateFilterSelector
                mode={createdDateFilter.mode}
                onModeChange={createdDateFilter.handleModeChange}
                selectedShift={createdDateFilter.selectedShift}
                onShiftSelect={createdDateFilter.handleShiftSelect}
                shifts={shifts}
                dateRange={createdDateFilter.dateRange}
                onDateRangeChange={createdDateFilter.handleDateRangeSelect}
                labelText={t("fueling_order.created_date_filter_by", "Фильтр даты создания")}
              />

              {/* Move Date Filter */}
              <DateFilterSelector
                mode={moveDateFilter.mode}
                onModeChange={moveDateFilter.handleModeChange}
                selectedShift={moveDateFilter.selectedShift}
                onShiftSelect={moveDateFilter.handleShiftSelect}
                shifts={shifts}
                dateRange={moveDateFilter.dateRange}
                onDateRangeChange={moveDateFilter.handleDateRangeSelect}
                labelText={t("fueling_order.move_date_filter_by", "Фильтр даты перемещения")}
              />
            </form>
          </Form>
        </div>
        <DialogFooter className="px-4 pb-4 flex flex-row gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={resetFilter}>
            {t("control.clear_filters")}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={form.handleSubmit(onSubmit)}
          >
            {t("control.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
