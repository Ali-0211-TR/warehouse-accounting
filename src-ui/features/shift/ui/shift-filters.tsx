import type { ShiftFilterState } from "@/entities/shift";
import { useUser } from "@/features/user";
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

interface ShiftFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: ShiftFilterState;
  onFiltersChange: (filters: ShiftFilterState) => void;
}

export function ShiftFilters({
  open,
  onClose,
  filters,
  onFiltersChange,
}: ShiftFiltersProps) {
  const { t } = useTranslation();
  const { users, loadUsers } = useUser();

  // Load data for dropdowns
  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open, loadUsers]);

  const filterFields = [
    {
      key: "search",
      label: t("control.search"),
      component: (
        <Input
          placeholder={t("shift.search_placeholder")}
          value={filters.search}
          onChange={e =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="w-full"
        />
      ),
    },
    {
      key: "user_id",
      label: t("shift.user"),
      component: (
        <Select
          value={filters.user_id || "all"}
          onValueChange={value =>
            onFiltersChange({
              ...filters,
              user_id: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("shift.select_user")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id!.toString()}>
                {user.full_name || user.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "is_open",
      label: t("shift.status"),
      component: (
        <Select
          value={
            filters.is_open !== undefined ? filters.is_open.toString() : "all"
          }
          onValueChange={value =>
            onFiltersChange({
              ...filters,
              is_open: value === "all" ? undefined : value === "true",
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("shift.select_status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="true">{t("shift.status_open")}</SelectItem>
            <SelectItem value="false">{t("shift.status_closed")}</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "date_range_start",
      label: t("shift.date_range_start"),
      component: (
        <DatePicker
          value={filters.date_range?.start ?? ""}
          onChange={date =>
            onFiltersChange({
              ...filters,
              date_range: {
                start: date ?? "",
                end: filters.date_range?.end ?? "",
              },
            })
          }
          placeholder={t("shift.select_start_date")}
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
      label: t("shift.date_range_end"),
      component: (
        <DatePicker
          value={filters.date_range?.end ?? ""}
          onChange={date =>
            onFiltersChange({
              ...filters,
              date_range: {
                start: filters.date_range?.start ?? "",
                end: date ?? "",
              },
            })
          }
          placeholder={t("shift.select_end_date")}
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
    // Convert applied filters to ShiftFilterState
    const hasStart = !!appliedFilters.date_range_start;
    const hasEnd = !!appliedFilters.date_range_end;
    const shiftFilters: ShiftFilterState = {
      search: appliedFilters.search || "",
      user_id:
        appliedFilters.user_id === "all" ? undefined : appliedFilters.user_id,
      is_open:
        appliedFilters.is_open === "all"
          ? undefined
          : appliedFilters.is_open === "true",
      date_range:
        hasStart || hasEnd
          ? {
              start: appliedFilters.date_range_start ?? "",
              end: appliedFilters.date_range_end ?? "",
            }
          : undefined,
    };
    onFiltersChange(shiftFilters);
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
