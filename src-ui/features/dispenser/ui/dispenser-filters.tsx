import { FilterDialog } from '@/shared/ui/components/FilterDialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { t } from 'i18next'
import type { DispenserFilterState } from '@/entities/dispenser'
import { DISPENSER_STATE_OPTIONS } from '@/shared/const/options'



const HAS_CAMERA_OPTIONS = [
    { value: true, label: 'common.yes' },
    { value: false, label: 'common.no' }
]

interface DispenserFiltersProps {
    open: boolean
    onClose: () => void
    filters: DispenserFilterState
    onFiltersChange: (filters: DispenserFilterState) => void
}

export function DispenserFilters({ open, onClose, filters, onFiltersChange }: DispenserFiltersProps) {
    const filterFields = [
        {
            key: 'search',
            label: t('control.search'),
            component: (
                <Input
                    placeholder={t('dispenser.search_placeholder')}
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                    className="w-full"
                />
            )
        },
        // {
        //     key: 'fueling_state',
        //     label: t('dispenser.fueling_state'),
        //     component: (
        //         <Select
        //             value={filters.fueling_state || 'all'}
        //             onValueChange={(value) =>
        //                 onFiltersChange({
        //                     ...filters,
        //                     fueling_state: value === 'all' ? undefined : value as any
        //                 })
        //             }
        //         >
        //             <SelectTrigger className="w-full">
        //                 <SelectValue placeholder={t('dispenser.select_fueling_state')} />
        //             </SelectTrigger>
        //             <SelectContent>
        //                 <SelectItem value="all">{t('common.all')}</SelectItem>
        //                 {FUELING_STATE_OPTIONS.map((option) => (
        //                     <SelectItem key={option.value} value={option.value}>
        //                         {t(option.label)}
        //                     </SelectItem>
        //                 ))}
        //             </SelectContent>
        //         </Select>
        //     )
        // },
        {
            key: 'state',
            label: t('dispenser.state'),
            component: (
                <Select
                    value={filters.state || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            state: value === 'all' ? undefined : value as any
                        })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('dispenser.select_state')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {DISPENSER_STATE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {t(option.label)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        },
        {
            key: 'has_camera',
            label: t('dispenser.has_camera'),
            component: (
                <Select
                    value={filters.has_camera !== undefined ? filters.has_camera.toString() : 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            has_camera: value === 'all' ? undefined : value === 'true'
                        })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('dispenser.select_has_camera')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {HAS_CAMERA_OPTIONS.map((option) => (
                            <SelectItem key={option.value.toString()} value={option.value.toString()}>
                                {t(option.label)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        }
    ]

    const handleApplyFilters = (appliedFilters: Record<string, any>) => {
        onFiltersChange(appliedFilters as DispenserFilterState)
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