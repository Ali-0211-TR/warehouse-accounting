import type { UnitEntity, UnitFilterState } from './types'

const getUnitCategory = (shortName: string): 'volume' | 'weight' | 'length' | 'other' => {
    const volumeUnits = ['л', 'мл', 'L', 'ml', 'gal', 'qt']
    const weightUnits = ['кг', 'г', 'kg', 'g', 'lb', 'oz']
    const lengthUnits = ['м', 'см', 'мм', 'm', 'cm', 'mm', 'ft', 'in']
    
    if (volumeUnits.some(unit => shortName.toLowerCase().includes(unit.toLowerCase()))) {
        return 'volume'
    }
    if (weightUnits.some(unit => shortName.toLowerCase().includes(unit.toLowerCase()))) {
        return 'weight'
    }
    if (lengthUnits.some(unit => shortName.toLowerCase().includes(unit.toLowerCase()))) {
        return 'length'
    }
    
    return 'other'
}

export const unitSelectors = {
    filterUnits: (units: UnitEntity[], filters: UnitFilterState): UnitEntity[] => {
        return units.filter(unit => {
            const matchesSearch = !filters.search || 
                unit.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                unit.short_name.toLowerCase().includes(filters.search.toLowerCase())

            const matchesCategory = !filters.category || 
                getUnitCategory(unit.short_name) === filters.category

            return matchesSearch && matchesCategory
        })
    },

    sortUnits: (units: UnitEntity[], sortBy: keyof UnitEntity = 'name'): UnitEntity[] => {
        return [...units].sort((a, b) => {
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

    getUnitsByCategory: (units: UnitEntity[], category: string): UnitEntity[] => {
        return units.filter(unit => getUnitCategory(unit.short_name) === category)
    },

    getCommonUnits: (units: UnitEntity[]): UnitEntity[] => {
        const commonShortNames = ['л', 'кг', 'м', 'шт', 'L', 'kg', 'm', 'pcs']
        return units.filter(unit => 
            commonShortNames.some(common => 
                unit.short_name.toLowerCase().includes(common.toLowerCase())
            )
        )
    }
}