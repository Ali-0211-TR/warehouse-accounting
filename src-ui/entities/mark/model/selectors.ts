import type { MarkEntity, MarkFilterState, MarkCategory } from './types'

const getMarkCategory = (name: string): MarkCategory => {
    const lowerName = name.toLowerCase()
    
    if (lowerName.includes('премиум') || lowerName.includes('premium')) {
        return 'premium'
    }
    if (lowerName.includes('эко') || lowerName.includes('eco')) {
        return 'eco'
    }
    if (lowerName.includes('стандарт') || lowerName.includes('standard')) {
        return 'standard'
    }
    if (lowerName.includes('vip') || lowerName.includes('люкс')) {
        return 'vip'
    }
    
    return 'other'
}

export const markSelectors = {
    filterMarks: (marks: MarkEntity[], filters: MarkFilterState): MarkEntity[] => {
        return marks.filter(mark => {
            const matchesSearch = !filters.search || 
                mark.name.toLowerCase().includes(filters.search.toLowerCase())

            const matchesCategory = !filters.category || 
                getMarkCategory(mark.name) === filters.category

            return matchesSearch && matchesCategory
        })
    },

    sortMarks: (marks: MarkEntity[], sortBy: keyof MarkEntity = 'name'): MarkEntity[] => {
        return [...marks].sort((a, b) => {
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

    getMarksByCategory: (marks: MarkEntity[], category: MarkCategory): MarkEntity[] => {
        return marks.filter(mark => getMarkCategory(mark.name) === category)
    },

    getPopularMarks: (marks: MarkEntity[]): MarkEntity[] => {
        // This would be based on actual usage statistics
        return marks.slice(0, 5)
    }
}