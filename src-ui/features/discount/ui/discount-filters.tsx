import { FilterDialog } from '@/shared/ui/components/FilterDialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { t } from 'i18next'
import type { DiscountFilterState } from '@/entities/discount'
import { DISCOUNT_BOUND_TYPE_OPTIONS, DISCOUNT_TYPE_OPTIONS, PRODUCT_TYPE_OPTIONS } from '@/shared/const/options'

interface DiscountFiltersProps {
    open: boolean
    onClose: () => void
    filters: DiscountFilterState
    onFiltersChange: (filters: DiscountFilterState) => void
}

export function DiscountFilters({ open, onClose, filters, onFiltersChange }: DiscountFiltersProps) {
    const filterFields = [
        {
            key: 'search',
            label: t('control.search'),
            component: (
                <Input
                    placeholder={t('discount.search_placeholder')}
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                    className="w-full"
                />
            )
        },
        {
            key: 'discount_type',
            label: t('discount.type'),
            component: (
                <Select
                    value={filters.discount_type || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            discount_type: value === 'all' ? undefined : value as any
                        })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('discount.select_type')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {DISCOUNT_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {t(option.label)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        },
        {
            key: 'product_type',
            label: t('discount.product_type'),
            component: (
                <Select
                    value={filters.product_type || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            product_type: value === 'all' ? undefined : value as any
                        })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('discount.select_product_type')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {PRODUCT_TYPE_OPTIONS.filter(option => option.value !== null).map((option) => (
                            <SelectItem key={option.value} value={option.value!}>
                                {t(option.label)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        },
        {
            key: 'bound_type',
            label: t('discount.bound_type'),
            component: (
                <Select
                    value={filters.bound_type || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            bound_type: value === 'all' ? undefined : value as any
                        })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('discount.select_bound_type')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {DISCOUNT_BOUND_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {t(option.label)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        }
    ]

    const handleApplyFilters = (appliedFilters: Record<string, any>) => {
        onFiltersChange(appliedFilters as DiscountFilterState)
        onClose() // Close the dialog after applying filters
    }

    return (
        <FilterDialog
            open={open}
            onClose={onClose}
            onApply={handleApplyFilters} // Use the new handler
            initialFilters={filters}
            fields={filterFields}
        />
    )
}