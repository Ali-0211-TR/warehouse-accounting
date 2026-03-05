import { FilterDialog } from '@/shared/ui/components/FilterDialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { DISPENSER_PROTOCOL_OPTIONS, PORT_SPEED_OPTIONS } from '@/shared/const/options'
import { t } from 'i18next'
import type { DispenserPortFilterState } from '@/entities/dispenser-port'

interface DispenserPortFiltersProps {
    open: boolean
    onClose: () => void
    filters: DispenserPortFilterState
    onFiltersChange: (filters: DispenserPortFilterState) => void
}

export function DispenserPortFilters({ open, onClose, filters, onFiltersChange }: DispenserPortFiltersProps) {
    const filterFields = [
        {
            key: 'search',
            label: t('control.search'),
            component: (
                <Input
                    placeholder={t('dispenser_port.search_placeholder')}
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                    className="w-full"
                />
            )
        },
        {
            key: 'protocol',
            label: t('dispenser_port.protocol'),
            component: (
                <Select
                    value={filters.protocol || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            protocol: value === 'all' ? undefined : value as any
                        })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('dispenser_port.select_protocol')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {DISPENSER_PROTOCOL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        },
        {
            key: 'port_speed',
            label: t('dispenser_port.port_speed'),
            component: (
                <Select
                    value={filters.port_speed?.toString() || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            port_speed: value === 'all' ? undefined : Number(value)
                        })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('dispenser_port.select_port_speed')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {PORT_SPEED_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        }
    ]

    const handleApplyFilters = (appliedFilters: Record<string, any>) => {
        onFiltersChange(appliedFilters as DispenserPortFilterState)
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