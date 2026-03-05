import { FilterDialog } from "@/shared/ui/components/FilterDialog";
import { Input } from "@/shared/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import { t } from "i18next";
import type { TaxFilterState } from "@/entities/tax";

interface TaxFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: TaxFilterState;
  onFiltersChange: (filters: TaxFilterState) => void;
}

export function TaxFilters({
  open,
  onClose,
  filters,
  onFiltersChange,
}: TaxFiltersProps) {
  const filterFields = [
    {
      key: "search",
      label: t("control.search"),
      component: (
        <Input
          placeholder={t("tax.search_placeholder")}
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="w-full"
        />
      ),
    },
    {
      key: "rate_range",
      label: t("tax.rate_range"),
      component: (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder={t("tax.rate_min")}
            value={filters.rate_min || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                rate_min: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
          <Input
            type="number"
            placeholder={t("tax.rate_max")}
            value={filters.rate_max || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                rate_max: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      ),
    },
    {
      key: "is_inclusive",
      label: t("tax.filter_by_type"),
      component: (
        <Select
          value={
            filters.is_inclusive === undefined
              ? "all"
              : filters.is_inclusive
                ? "inclusive"
                : "exclusive"
          }
          onValueChange={(value) => {
            let newValue: boolean | undefined;
            if (value === "inclusive") newValue = true;
            else if (value === "exclusive") newValue = false;
            else newValue = undefined;

            onFiltersChange({ ...filters, is_inclusive: newValue });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("tax.select_type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="inclusive">{t("tax.inclusive")}</SelectItem>
            <SelectItem value="exclusive">{t("tax.exclusive")}</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "status",
      label: t("tax.status"),
      component: (
        <Select
          value={filters.status || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              status:
                value === "all" ? undefined : (value as "active" | "pending"),
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("tax.select_status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="active">{t("tax.status.active")}</SelectItem>
            <SelectItem value="pending">{t("tax.status.pending")}</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ];

  const handleApplyFilters = (appliedFilters: Record<string, any>) => {
    onFiltersChange(appliedFilters as TaxFilterState);
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
