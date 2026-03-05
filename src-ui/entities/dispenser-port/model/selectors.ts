import type { DispenserPortEntity, DispenserPortFilterState } from './types'

export const dispenserPortSelectors = {
    filterDispenserPorts: (dispenserPorts: DispenserPortEntity[], filters: DispenserPortFilterState): DispenserPortEntity[] => {
        return dispenserPorts.filter(dispenserPort => {
            const matchesSearch = !filters.search ||
                dispenserPort.port_name.toLowerCase().includes(filters.search.toLowerCase())

            const matchesProtocol = !filters.protocol ||
                dispenserPort.protocol === filters.protocol

            const matchesPortSpeed = !filters.port_speed ||
                dispenserPort.port_speed === filters.port_speed

            return matchesSearch && matchesProtocol && matchesPortSpeed
        })
    },

    sortDispenserPorts: (dispenserPorts: DispenserPortEntity[], sortBy: keyof DispenserPortEntity = 'port_name'): DispenserPortEntity[] => {
        return [...dispenserPorts].sort((a, b) => {
            const aVal = a[sortBy]
            const bVal = b[sortBy]

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return aVal.localeCompare(bVal)
            }

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return aVal - bVal
            }

            return 0
        })
    }
}