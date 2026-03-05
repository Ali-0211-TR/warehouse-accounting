import { FilterDialog } from '@/shared/ui/components/FilterDialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { t } from 'i18next'
import type { GroupFilterState } from '@/entities/group'
import { GROUP_TYPE_OPTIONS } from '@/shared/const/options'

interface GroupFiltersProps {
    open: boolean
    onClose: () => void
    filters: GroupFilterState
    onFiltersChange: (filters: GroupFilterState) => void
}

export function GroupFilters({ open, onClose, filters, onFiltersChange }: GroupFiltersProps) {
    const filterFields = [
        {
            key: 'search',
            label: t('control.search'),
            component: (
                <Input
                    placeholder={t('group.search_placeholder')}
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                    className="w-full"
                />
            )
        },
        {
            key: 'group_type',
            label: t('group.type'),
            component: (
                <Select
                    value={filters.group_type || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            group_type: value === 'all' ? undefined : value as any
                        })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('group.select_type')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {GROUP_TYPE_OPTIONS.map((option) => (
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
        onFiltersChange(appliedFilters as GroupFilterState)
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