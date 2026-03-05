import type { DispenserEntity, DispenserFilterState } from './types'

export const dispenserSelectors = {
    filterDispensers: (dispensers: DispenserEntity[], filters: DispenserFilterState): DispenserEntity[] => {
        return dispensers.filter(dispenser => {
            const matchesSearch = !filters.search || 
                dispenser.name.toLowerCase().includes(filters.search.toLowerCase())

            const matchesFuelingState = !filters.fueling_state || 
                dispenser.fueling_state === filters.fueling_state

            const matchesState = !filters.state || 
                dispenser.state === filters.state

            const matchesHasCamera = filters.has_camera === undefined || 
                (filters.has_camera ? dispenser.camera !== null : dispenser.camera === null)

            return matchesSearch && matchesFuelingState && matchesState && matchesHasCamera
        })
    },

    sortDispensers: (dispensers: DispenserEntity[], sortBy: keyof DispenserEntity = 'name'): DispenserEntity[] => {
        return [...dispensers].sort((a, b) => {
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