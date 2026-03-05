import type { TankEntity, TankFilterState } from '@/entities/tank'
import { tankSelectors } from '@/entities/tank'
import { useMemo, useState } from 'react'

export function useTankFilters(tanks: TankEntity[]) {
    const [filters, setFilters] = useState<TankFilterState>({
        search: '',
        product_id: undefined
    })

    const filteredTanks = useMemo(() => {
        return tankSelectors.filterTanks(tanks, filters)
    }, [tanks, filters])

    const hasActiveFilters = useMemo(() => {
        return filters.search !== '' || (filters.product_id !== undefined && filters.product_id !== '')
    }, [filters])

    const clearFilters = () => {
        setFilters({
            search: '',
            product_id: undefined
        })
    }

    return {
        filters,
        filteredTanks,
        hasActiveFilters,
        setFilters,
        clearFilters
    }
}
