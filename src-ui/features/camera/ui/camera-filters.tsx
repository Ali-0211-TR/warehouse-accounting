import { FilterDialog } from '@/shared/ui/components/FilterDialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { t } from 'i18next'
import type { CameraFilterState } from '@/entities/camera'
import { CAMERA_TYPE_OPTIONS } from '@/shared/const/options'

interface CameraFiltersProps {
    open: boolean
    onClose: () => void
    filters: CameraFilterState
    onFiltersChange: (filters: CameraFilterState) => void
}

export function CameraFilters({ open, onClose, filters, onFiltersChange }: CameraFiltersProps) {
    const filterFields = [
        {
            key: 'search',
            label: t('control.search'),
            component: (
                <Input
                    placeholder={t('camera.search_placeholder')}
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                    className="w-full"
                />
            )
        },
        {
            key: 'camera_type',
            label: t('camera.type'),
            component: (
                <Select
                    value={filters.camera_type || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            camera_type: value === 'all' ? undefined : value as any
                        })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('camera.select_type')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {CAMERA_TYPE_OPTIONS.map((option) => (
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
        onFiltersChange(appliedFilters as CameraFilterState)
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