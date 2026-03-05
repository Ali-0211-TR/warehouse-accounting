import { useGroupStore } from "@/entities/group";
import type { ProductFilterState } from "@/entities/product";
import { getProductTypeOptions } from "@/shared/const/lists";
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
import { useEffect } from "react";

interface ProductFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: ProductFilterState;
  onFiltersChange: (filters: ProductFilterState) => void;
}

export function ProductFilters({
  open,
  onClose,
  filters,
  onFiltersChange,
}: ProductFiltersProps) {
  const { groups, loadGroups } = useGroupStore();
  const productTypeOptions = getProductTypeOptions();

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const filterFields = [
    {
      key: "search",
      label: t("control.search"),
      component: (
        <Input
          placeholder={t("product.search_placeholder")}
          value={filters.search}
          onChange={e =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="w-full"
        />
      ),
    },
    {
      key: "product_type",
      label: t("product.product_type"),
      component: (
        <Select
          value={filters.product_type || "all"}
          onValueChange={value =>
            onFiltersChange({
              ...filters,
              product_type: value === "all" ? undefined : (value as any),
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("product.select_product_type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {productTypeOptions.map(option => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "group_id",
      label: t("product.group"),
      component: (
        <Select
          value={filters.group_id || "all"}
          onValueChange={value =>
            onFiltersChange({
              ...filters,
              group_id: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("product.select_group")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {groups.map(group => (
              <SelectItem key={group.id} value={group.id!.toString()}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    // {
    //     key: 'balance_status',
    //     label: t('product.balance_status'),
    //     component: (
    //         <Select
    //             value={filters.balance_status || 'all'}
    //             onValueChange={(value) =>
    //                 onFiltersChange({
    //                     ...filters,
    //                     balance_status: value === 'all' ? undefined : value as any
    //                 })
    //             }
    //         >
    //             <SelectTrigger className="w-full">
    //                 <SelectValue placeholder={t('product.select_balance_status')} />
    //             </SelectTrigger>
    //             <SelectContent>
    //                 <SelectItem value="all">{t('common.all')}</SelectItem>
    //                 <SelectItem value="in_stock">{t('product.balance_status.in_stock')}</SelectItem>
    //                 <SelectItem value="low_stock">{t('product.balance_status.low_stock')}</SelectItem>
    //                 <SelectItem value="out_of_stock">{t('product.balance_status.out_of_stock')}</SelectItem>
    //             </SelectContent>
    //         </Select>
    //     )
    // }
  ];

  const handleApplyFilters = (appliedFilters: Record<string, any>) => {
    onFiltersChange(appliedFilters as ProductFilterState);
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
