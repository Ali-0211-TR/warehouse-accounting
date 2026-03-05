import { useClientStore } from "@/entities/client";
import type { ContractFilterState } from "@/entities/contract";
import { DatePicker } from "@/shared/ui/components/DatePicker";
import { FilterDialog } from "@/shared/ui/components/FilterDialog";
import { Input } from "@/shared/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface ContractFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: ContractFilterState;
  onFiltersChange: (filters: ContractFilterState) => void;
}

export function ContractFilters({
  open,
  onClose,
  filters,
  onFiltersChange,
}: ContractFiltersProps) {
  const { t } = useTranslation();
  const { clients, loadClients } = useClientStore();

  // Load clients for dropdowns
  useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open, loadClients]);

  interface FilterField {
    key: string;
    label: string;
    component: React.ReactNode;
  }

  const filterFields: FilterField[] = [
    {
      key: "search",
      label: t("control.search"),
      component: (
        <Input
          placeholder={t("contract.search_placeholder")}
          value={filters.search}
          onChange={e =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="w-full"
        />
      ),
    },
    {
      key: "client_id",
      label: t("contract.client"),
      component: (
        <Select
          value={filters.client_id || "all"}
          onValueChange={(value: string) =>
            onFiltersChange({
              ...filters,
              client_id: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("contract.select_client")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id!}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "date_range_start",
      label: t("contract.date_range_start"),
      component: (
        <DatePicker
          value={filters.date_range?.start}
          onChange={(date: string | undefined) =>
            onFiltersChange({
              ...filters,
              date_range: {
                ...filters.date_range,
                start: date,
              },
            })
          }
          placeholder={t("contract.select_start_date")}
          maxDate={
            filters.date_range?.end
              ? new Date(filters.date_range.end)
              : undefined
          }
        />
      ),
    },
    {
      key: "date_range_end",
      label: t("contract.date_range_end"),
      component: (
        <DatePicker
          value={filters.date_range?.end}
          onChange={(date: string | undefined) =>
            onFiltersChange({
              ...filters,
              date_range: {
                ...filters.date_range,
                end: date,
              },
            })
          }
          placeholder={t("contract.select_end_date")}
          minDate={
            filters.date_range?.start
              ? new Date(filters.date_range.start)
              : undefined
          }
        />
      ),
    },
  ];

  const handleApplyFilters = (appliedFilters: Record<string, any>) => {
    // Convert applied filters to ContractFilterState
    const contractFilters: ContractFilterState = {
      search: appliedFilters.search || "",
      client_id:
        appliedFilters.client_id === "all"
          ? undefined
          : appliedFilters.client_id,
      date_range:
        appliedFilters.date_range_start || appliedFilters.date_range_end
          ? {
              start: appliedFilters.date_range_start,
              end: appliedFilters.date_range_end,
            }
          : undefined,
    };
    onFiltersChange(contractFilters);
    onClose();
  };

  return (
    <FilterDialog
      open={open}
      onClose={onClose}
      onApply={handleApplyFilters}
      initialFilters={filters}
      fields={filterFields}
    />
  );
}
