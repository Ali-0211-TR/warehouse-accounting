import { ClientEntity, useClientStore } from "@/entities/client";
import { ClientSelector } from "@/entities/client/ui/ClientSelector";
import { orderFilterSchema } from "@/entities/order/model/schemas";
import { getOrderTypeOptions } from "@/shared/const/lists";
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
import {
  convertDateRangeToISO,
  convertISOToDateRange,
} from "@/shared/utils/date";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import z from "zod";
import { useOrderStore } from "@/entities/order";
import { DateFilterSelector } from "@/entities/shift/ui/DateFilterSelector";
import { useDateFilter } from "@/features/shift/model/use-date-filter";
import { useShiftStore } from "@/entities/shift";

interface OrderFiltersProps {
  open: boolean;
  onClose: () => void;
}

export function OrderFilters({ open, onClose }: OrderFiltersProps) {
  const { t } = useTranslation();
  const { clients, loadClients } = useClientStore();
  const orderTypeOptions = getOrderTypeOptions();

  const setFilters = useOrderStore((s) => s.setFilters);
  const clearFilter = useOrderStore((s) => s.clearFilter);
  const query = useOrderStore((s) => s.query);
  const { shifts, loadShifts } = useShiftStore();

  // Load data for dropdowns
  useEffect(() => {
    if (open) {
      loadClients();
      loadShifts();
    }
  }, [open, loadClients, loadShifts]);

  const form = useForm<z.infer<typeof orderFilterSchema>>({
    resolver: zodResolver(orderFilterSchema),
    defaultValues: {
      search: "",
      id: query.filters.id ?? undefined,
      orderType: query.filters.order_type ?? "all",
      clientId: query.filters.client_id ?? undefined,
      company: query.filters.company ?? undefined,
      dateRange: convertISOToDateRange(query.filters.d_move),
    },
  });

  const dateFilter = useDateFilter({
    initialMode: "shift",
    onShiftChange: (_shift, range) => {
      if (range) {
        form.setValue("dateRange", range);
      }
    },
    onDateRangeChange: (range) => {
      form.setValue("dateRange", range || null);
    },
  });

  // Update form when query filters change
  useEffect(() => {
    form.reset({
      search: "",
      id: query.filters.id ?? undefined,
      orderType: query.filters.order_type ?? "all",
      clientId: query.filters.client_id ?? undefined,
      company: query.filters.company ?? undefined,
      dateRange: convertISOToDateRange(query.filters.d_move),
    });
  }, [query.filters, form]);

  function onSubmit(values: z.infer<typeof orderFilterSchema>) {
    setFilters({
      id: values.id || null,
      order_type: values.orderType === "all" ? null : values.orderType || null,
      client_id: values.clientId || null,
      company: values.company || null,
      d_move: convertDateRangeToISO(values.dateRange),
    });
    onClose();
  }

  async function resetFilter() {
    await clearFilter();
    dateFilter.reset();
    // Form will be reset automatically by the useEffect above when query.filters change
    onClose(); // Close dialog after reset - user wants clean slate
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-4">
        <DialogHeader>
          <DialogTitle>{t("control.filters")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="search"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.search")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("common.search_placeholder")}
                        {...field}
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
                    <FormLabel>{t("order.order_id")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t("order.enter_order_id")}
                        {...field}
                        value={field.value || ""}
                        onChange={e =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("order.order_type")}</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={value => field.onChange(value || null)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t("order.select_order_type")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        {orderTypeOptions.map(option => (
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
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("order.client")}</FormLabel>
                    <FormControl>
                      <ClientSelector
                        value={clients.find(c => c.id === field.value) || null}
                        onSelect={(client: ClientEntity | null) =>
                          field.onChange(client?.id || null)
                        }
                        placeholder={t("client.select_client")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("order.company")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("order.enter_company")}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DateFilterSelector
                mode={dateFilter.mode}
                onModeChange={dateFilter.handleModeChange}
                selectedShift={dateFilter.selectedShift}
                onShiftSelect={dateFilter.handleShiftSelect}
                shifts={shifts}
                dateRange={dateFilter.dateRange}
                onDateRangeChange={dateFilter.handleDateRangeSelect}
                labelText={t("order.created_date_filter_by", "Фильтр даты создания")}
              />
            </form>
          </Form>
        </div>
        <DialogFooter className="flex flex-row gap-2 justify-end mt-4">
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
