import { FilterDialog } from '@/shared/ui/components/FilterDialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { t } from 'i18next'
import type { MarkFilterState } from '@/entities/mark'

interface MarkFiltersProps {
    open: boolean
    onClose: () => void
    filters: MarkFilterState
    onFiltersChange: (filters: MarkFilterState) => void
}

export function MarkFilters({ open, onClose, filters, onFiltersChange }: MarkFiltersProps) {
    const filterFields = [
        {
            key: 'search',
            label: t('control.search'),
            component: (
                <Input
                    placeholder={t('mark.search_placeholder')}
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                    className="w-full"
                />
            )
        },
        {
            key: 'category',
            label: t('mark.category'),
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
                        <SelectValue placeholder={t('mark.select_category')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        <SelectItem value="premium">{t('mark.category.premium')}</SelectItem>
                        <SelectItem value="eco">{t('mark.category.eco')}</SelectItem>
                        <SelectItem value="standard">{t('mark.category.standard')}</SelectItem>
                        <SelectItem value="vip">{t('mark.category.vip')}</SelectItem>
                        <SelectItem value="other">{t('mark.category.other')}</SelectItem>
                    </SelectContent>
                </Select>
            )
        }
    ]

    const handleApplyFilters = (appliedFilters: Record<string, any>) => {
        onFiltersChange(appliedFilters as MarkFilterState)
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