import type { TankEntity, TankFilterState } from './types'

export const tankSelectors = {
    filterTanks: (tanks: TankEntity[], filters: TankFilterState): TankEntity[] => {
        return tanks.filter(tank => {
            const matchesSearch = !filters.search ||
                tank.name.toLowerCase().includes(filters.search.toLowerCase())

            const matchesProduct = !filters.product_id ||
                (tank.product?.id ?? '') === filters.product_id

            return matchesSearch && matchesProduct
        })
    },

    sortTanks: (tanks: TankEntity[], sortBy: keyof TankEntity = 'name'): TankEntity[] => {
        return [...tanks].sort((a, b) => {
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
