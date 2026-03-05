import { useState, useMemo } from 'react'
import { dispenserPortSelectors } from '@/entities/dispenser-port'
import type { DispenserPortEntity, DispenserPortFilterState } from '@/entities/dispenser-port'

export function useDispenserPortFilters(dispenserPorts: DispenserPortEntity[]) {
    const [filters, setFilters] = useState<DispenserPortFilterState>({
        search: '',
        protocol: undefined,
        port_speed: undefined
    })

    const filteredDispenserPorts = useMemo(() => {
        return dispenserPortSelectors.filterDispenserPorts(dispenserPorts, filters)
    }, [dispenserPorts, filters])

    const hasActiveFilters = useMemo(() => {
        return filters.search !== '' ||
            filters.protocol !== undefined ||
            filters.port_speed !== undefined
    }, [filters])

    const clearFilters = () => {
        setFilters({
            search: '',
            protocol: undefined,
            port_speed: undefined
        })
    }

    return {
        filters,
        filteredDispenserPorts,
        hasActiveFilters,
        setFilters,
        clearFilters
    }
}