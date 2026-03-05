import { FilterDialog } from "@/shared/ui/components/FilterDialog";
import { Input } from "@/shared/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import { useTranslation } from "react-i18next";
import type { ClientFilterState } from "@/entities/client";
import { getClientTypeOptions } from "@/shared/const/lists";
import { ClientType } from "@/shared/bindings/ClientType";

interface ClientFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: ClientFilterState;
  onFiltersChange: (filters: ClientFilterState) => void;
}

export function ClientFilters({
  open,
  onClose,
  filters,
  onFiltersChange,
}: ClientFiltersProps) {
  const { t } = useTranslation();
  const clientTypeOptions = getClientTypeOptions();

  const filterFields = [
    {
      key: "search",
      label: t("control.search"),
      component: (
        <Input
          placeholder={t("client.search_placeholder")}
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="w-full"
        />
      ),
    },
    {
      key: "client_type",
      label: t("client.client_type"),
      component: (
        <Select
          value={filters.client_type || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              client_type: value === "all" ? undefined : (value as ClientType),
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("client.select_client_type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {clientTypeOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "has_tax_code",
      label: t("client.has_tax_code"),
      component: (
        <Select
          value={
            filters.has_tax_code !== undefined
              ? filters.has_tax_code.toString()
              : "all"
          }
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              has_tax_code: value === "all" ? undefined : value === "true",
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("client.select_tax_code_status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="true">{t("client.has_tax_code_yes")}</SelectItem>
            <SelectItem value="false">{t("client.has_tax_code_no")}</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ];

  const handleApplyFilters = (appliedFilters: Record<string, any>) => {
    // Convert applied filters to ClientFilterState
    const clientFilters: ClientFilterState = {
      search: appliedFilters.search || "",
      client_type:
        appliedFilters.client_type === "all"
          ? undefined
          : appliedFilters.client_type,
      has_tax_code:
        appliedFilters.has_tax_code === "all"
          ? undefined
          : appliedFilters.has_tax_code === "true",
    };
    onFiltersChange(clientFilters);
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
