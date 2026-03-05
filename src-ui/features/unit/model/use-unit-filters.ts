import { useState, useMemo } from 'react'
import { unitSelectors } from '@/entities/unit'
import type { UnitEntity, UnitFilterState } from '@/entities/unit'

export function useUnitFilters(units: UnitEntity[]) {
    const [filters, setFilters] = useState<UnitFilterState>({
        search: '',
        category: undefined
    })

    const filteredUnits = useMemo(() => {
        return unitSelectors.filterUnits(units, filters)
    }, [units, filters])

    const hasActiveFilters = useMemo(() => {
        return filters.search !== '' ||
            filters.category !== undefined
    }, [filters])

    const clearFilters = () => {
        setFilters({
            search: '',
            category: undefined
        })
    }

    return {
        filters,
        filteredUnits,
        hasActiveFilters,
        setFilters,
        clearFilters
    }
}