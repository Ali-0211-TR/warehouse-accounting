import { ClientEntity, useClientStore } from "@/entities/client";
import { ClientSelector } from "@/entities/client/ui/ClientSelector";
import { useContractStore } from "@/entities/contract";
import { useOrderMovementStore } from "@/entities/order/model/order-movement-store";
import { orderFilterSchema } from "@/entities/order/model/schemas";
import { useShiftStore } from "@/entities/shift";
import { DateFilterSelector } from "@/entities/shift/ui/DateFilterSelector";
import { useDateFilter } from "@/features/shift/model/use-date-filter";
import { useProductStore } from "@/entities/product";
import { useGroupStore } from "@/entities/group/model/store";
import { getOrderTypeOptions } from "@/shared/const/lists";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/shadcn/command";
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
} from "@/shared/ui/shadcn/form";
import { Input } from "@/shared/ui/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
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
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import z from "zod";

interface OrderFiltersProps {
  open: boolean;
  onClose: () => void;
  /** Client-side product filter (product ID or null) */
  productFilter?: string | null;
  onProductFilterChange?: (productId: string | null) => void;
  /** Client-side group filter (group ID or null) */
  groupFilter?: string | null;
  onGroupFilterChange?: (groupId: string | null) => void;
  /** Called when client-side filters are cleared */
  onClientFiltersClear?: () => void;
}

/* ────────────────────────────────────────────────────────── */
/*  Searchable Combobox for Product / Group                  */
/* ────────────────────────────────────────────────────────── */
interface SearchableComboboxProps {
  value: string | null;
  onChange: (value: string | null) => void;
  items: { id: string; label: string }[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
}

function SearchableCombobox({
  value,
  onChange,
  items,
  placeholder,
  searchPlaceholder,
  emptyText,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(
    () => items.find((i) => i.id === value)?.label ?? null,
    [items, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-9 px-3"
        >
          <span className="truncate">
            {selectedLabel ?? placeholder}
          </span>
          {value ? (
            <X
              className="ml-1 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            />
          ) : (
            <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-52">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  onSelect={() => {
                    onChange(item.id === value ? null : item.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Main filter dialog                                       */
/* ────────────────────────────────────────────────────────── */
export function OrderReportFilters({
  open,
  onClose,
  productFilter,
  onProductFilterChange,
  groupFilter,
  onGroupFilterChange,
  onClientFiltersClear,
}: OrderFiltersProps) {
  const { t } = useTranslation();
  const { clients, loadClients } = useClientStore();
  const { loadContracts } = useContractStore();
  const { shifts, loadShifts } = useShiftStore();
  const orderTypeOptions = getOrderTypeOptions();
  const products = useProductStore((s) => s.products);
  const loadProducts = useProductStore((s) => s.loadProducts);
  const { groups, loadGroups } = useGroupStore();

  const { setFilters, clearFilter, query } = useOrderMovementStore();

  // Filter groups to only "Product" type
  const productGroups = useMemo(
    () => groups.filter((g) => g.group_type === "Product"),
    [groups],
  );

  // Prepare items for comboboxes
  const productItems = useMemo(
    () =>
      products
        .filter((p) => p.id != null)
        .map((p) => ({ id: p.id!, label: p.name })),
    [products],
  );

  const groupItems = useMemo(
    () =>
      productGroups
        .filter((g) => g.id != null)
        .map((g) => ({ id: g.id!, label: g.name })),
    [productGroups],
  );

  useEffect(() => {
    if (open) {
      loadClients();
      loadContracts();
      loadShifts();
      loadProducts();
      loadGroups();
    }
  }, [open, loadClients, loadContracts, loadShifts, loadProducts, loadGroups]);

  const form = useForm<z.infer<typeof orderFilterSchema>>({
    resolver: zodResolver(orderFilterSchema),
    defaultValues: {
      search: "",
      id: query.filters.id ?? undefined,
      orderType: query.filters.order_type ?? "all",
      clientId: query.filters.client_id ?? undefined,
      company: query.filters.company ?? undefined,
      shiftId: undefined,
      dateRange: convertISOToDateRange(query.filters.d_move),
    },
  });

  const dateFilter = useDateFilter({
    initialMode: "shift",
    onShiftChange: (_shift, range) => {
      form.setValue("dateRange", range ?? null);
    },
    onDateRangeChange: (range) => {
      form.setValue("dateRange", range ?? null);
    },
  });

  useEffect(() => {
    form.reset({
      search: "",
      id: query.filters.id ?? undefined,
      orderType: query.filters.order_type ?? "all",
      clientId: query.filters.client_id ?? undefined,
      company: query.filters.company ?? undefined,
      shiftId: undefined,
      dateRange: convertISOToDateRange(query.filters.d_move),
    });
  }, [query.filters, form]);

  useEffect(() => {
    if (!open) return;
    if (!query.filters.d_move) return;
    if (!shifts || shifts.length === 0) return;

    const [fromIso] = query.filters.d_move;
    const match = shifts.find((s) => s.d_open === fromIso);

    if (match) {
      dateFilter.handleModeChange("shift");
      dateFilter.handleShiftSelect(match);
      form.setValue("shiftId", match.id ?? undefined);
      form.setValue("dateRange", convertISOToDateRange(query.filters.d_move));
    }
  }, [open, shifts, query.filters.d_move, dateFilter, form]);

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
    onProductFilterChange?.(null);
    onGroupFilterChange?.(null);
    onClientFiltersClear?.();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          w-[95vw] max-w-lg
          h-[85dvh] max-h-[700px]
          flex flex-col
          overflow-hidden
          p-0
        "
      >
        {/* HEADER */}
        <DialogHeader className="shrink-0 border-b px-4 py-3">
          <DialogTitle>{t("control.filters")}</DialogTitle>
        </DialogHeader>

        {/* SCROLL ZONE */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          <Form {...form}>
            <form className="space-y-4">
              {/* ── Search (top) ── */}
              <FormField
                control={form.control}
                name="search"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.search")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "order.search_placeholder",
                          "Поиск заказов...",
                        )}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* ── Date range ── */}
              <DateFilterSelector
                mode={dateFilter.mode}
                onModeChange={dateFilter.handleModeChange}
                selectedShift={dateFilter.selectedShift}
                onShiftSelect={dateFilter.handleShiftSelect}
                shifts={shifts}
                dateRange={dateFilter.dateRange}
                onDateRangeChange={dateFilter.handleDateRangeSelect}
              />

              {/* ── Order type ── */}
              <FormField
                control={form.control}
                name="orderType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("order.order_type")}</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={(v) => field.onChange(v || null)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">
                          {t("common.all")}
                        </SelectItem>
                        {orderTypeOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* ── Product (searchable combobox, client-side) ── */}
              {onProductFilterChange && (
                <FormItem>
                  <FormLabel>{t("order.product", "Товар")}</FormLabel>
                  <SearchableCombobox
                    value={productFilter ?? null}
                    onChange={onProductFilterChange}
                    items={productItems}
                    placeholder={t("common.all", "Все")}
                    searchPlaceholder={t(
                      "order.search_product",
                      "Поиск товара...",
                    )}
                    emptyText={t(
                      "order.no_product_found",
                      "Товар не найден",
                    )}
                  />
                </FormItem>
              )}

              {/* ── Product group (searchable combobox, client-side) ── */}
              {onGroupFilterChange && (
                <FormItem>
                  <FormLabel>
                    {t("order.product_group", "Группа товаров")}
                  </FormLabel>
                  <SearchableCombobox
                    value={groupFilter ?? null}
                    onChange={onGroupFilterChange}
                    items={groupItems}
                    placeholder={t("common.all", "Все")}
                    searchPlaceholder={t(
                      "order.search_group",
                      "Поиск группы...",
                    )}
                    emptyText={t(
                      "order.no_group_found",
                      "Группа не найдена",
                    )}
                  />
                </FormItem>
              )}

              {/* ── Client ── */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("order.client")}</FormLabel>
                    <ClientSelector
                      value={
                        clients.find((c) => c.id === field.value) || null
                      }
                      onSelect={(c: ClientEntity | null) =>
                        field.onChange(c?.id || null)
                      }
                    />
                  </FormItem>
                )}
              />

              {/* ── Company ── */}
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("order.company")}</FormLabel>
                    <Input {...field} value={field.value || ""} />
                  </FormItem>
                )}
              />

              {/* ── Order ID ── */}
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("order.order_id")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* FOOTER */}
        <DialogFooter className="shrink-0 border-t px-4 py-3 gap-2">
          <Button variant="outline" size="sm" onClick={resetFilter}>
            {t("control.clear_filters")}
          </Button>
          <Button size="sm" onClick={form.handleSubmit(onSubmit)}>
            {t("control.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
