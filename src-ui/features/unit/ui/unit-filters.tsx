import { FilterDialog } from '@/shared/ui/components/FilterDialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { t } from 'i18next'
import type { UnitFilterState } from '@/entities/unit'

interface UnitFiltersProps {
    open: boolean
    onClose: () => void
    filters: UnitFilterState
    onFiltersChange: (filters: UnitFilterState) => void
}

export function UnitFilters({ open, onClose, filters, onFiltersChange }: UnitFiltersProps) {
    const filterFields = [
        {
            key: 'search',
            label: t('control.search'),
            component: (
                <Input
                    placeholder={t('unit.search_placeholder')}
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                    className="w-full"
                />
            )
        },
        {
            key: 'category',
            label: t('unit.category'),
            component: (
                <Select
                    value={filters.category || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            category: value === 'all' ? undefined : value as any
                        })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('unit.select_category')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        <SelectItem value="volume">{t('unit.category.volume')}</SelectItem>
                        <SelectItem value="weight">{t('unit.category.weight')}</SelectItem>
                        <SelectItem value="length">{t('unit.category.length')}</SelectItem>
                        <SelectItem value="other">{t('unit.category.other')}</SelectItem>
                    </SelectContent>
                </Select>
            )
        }
    ]

    const handleApplyFilters = (appliedFilters: Record<string, any>) => {
        onFiltersChange(appliedFilters as UnitFilterState)
        onClose()
    }

    return (
        <FilterDialog
            open={open}
            onClose={onClose}
            onApply={handleApplyFilters}
            initialFilters={filters}
            fields={filterFields}
        />
    )
}