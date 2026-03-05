import { useState, useMemo } from 'react'
import { dispenserSelectors } from '@/entities/dispenser'
import type { DispenserEntity, DispenserFilterState } from '@/entities/dispenser'

export function useDispenserFilters(dispensers: DispenserEntity[]) {
    const [filters, setFilters] = useState<DispenserFilterState>({
        search: '',
        fueling_state: undefined,
        state: undefined,
        has_camera: undefined
    })

    const filteredDispensers = useMemo(() => {
        return dispenserSelectors.filterDispensers(dispensers, filters)
    }, [dispensers, filters])

    const hasActiveFilters = useMemo(() => {
        return filters.search !== '' ||
            filters.fueling_state !== undefined ||
            filters.state !== undefined ||
            filters.has_camera !== undefined
    }, [filters])

    const clearFilters = () => {
        setFilters({
            search: '',
            fueling_state: undefined,
            state: undefined,
            has_camera: undefined
        })
    }

    return {
        filters,
        filteredDispensers,
        hasActiveFilters,
        setFilters,
        clearFilters
    }
}