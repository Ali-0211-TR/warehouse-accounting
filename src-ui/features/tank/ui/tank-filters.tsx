import type { TankFilterState } from '@/entities/tank'
import { useProduct } from '@/features/product'
import { FilterDialog } from '@/shared/ui/components/FilterDialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'
import { t } from 'i18next'


interface TankFiltersProps {
    open: boolean
    onClose: () => void
    filters: TankFilterState
    onFiltersChange: (filters: TankFilterState) => void
}

export function TankFilters({ open, onClose, filters, onFiltersChange }: TankFiltersProps) {
    const { products } = useProduct()

    const fuelingProducts = products.filter(
        product => product.product_type === 'Product' || product.product_type === 'Service'
    )

    const filterFields = [
        {
            key: 'search',
            label: t('control.search'),
            component: (
                <Input
                    placeholder={t('tank.search_placeholder')}
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                    className="w-full"
                />
            )
        },
        {
            key: 'product_id',
            label: t('tank.product'),
            component: (
                <Select
                    value={filters.product_id || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            product_id: value === 'all' ? undefined : value
                        })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('tank.select_product')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {fuelingProducts
                            .filter(option => option.id !== null)
                            .map(option => (
                                <SelectItem key={option.id} value={option.id!}>
                                    {option.name}
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            )
        }
    ]

    const handleApplyFilters = (appliedFilters: Record<string, any>) => {
        onFiltersChange(appliedFilters as TankFilterState)
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
