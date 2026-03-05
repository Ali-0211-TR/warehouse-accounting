import type { TaxEntity, TaxFilterState } from './types'

export const taxSelectors = {
    filterTaxes: (taxes: TaxEntity[], filters: TaxFilterState): TaxEntity[] => {
        return taxes.filter(tax => {
            const matchesSearch = !filters.search || 
                tax.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                tax.short_name.toLowerCase().includes(filters.search.toLowerCase())

            const matchesRateMin = filters.rate_min === undefined || 
                tax.rate >= filters.rate_min

            const matchesRateMax = filters.rate_max === undefined || 
                tax.rate <= filters.rate_max

            const matchesInclusive = filters.is_inclusive === undefined || 
                tax.is_inclusive === filters.is_inclusive

            const matchesStatus = !filters.status || 
                (filters.status === 'active' && new Date(tax.d_begin) <= new Date()) ||
                (filters.status === 'pending' && new Date(tax.d_begin) > new Date())

            return matchesSearch && matchesRateMin && matchesRateMax && matchesInclusive && matchesStatus
        })
    },

    sortTaxes: (taxes: TaxEntity[], sortBy: keyof TaxEntity = 'name'): TaxEntity[] => {
        return [...taxes].sort((a, b) => {
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
    },

    getActiveTaxes: (taxes: TaxEntity[]): TaxEntity[] => {
        const now = new Date()
        return taxes.filter(tax => new Date(tax.d_begin) <= now)
    },

    getTaxesByRate: (taxes: TaxEntity[], minRate: number, maxRate: number): TaxEntity[] => {
        return taxes.filter(tax => tax.rate >= minRate && tax.rate <= maxRate)
    }
}