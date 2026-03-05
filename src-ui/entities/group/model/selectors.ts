import type { GroupEntity, GroupFilterState } from './types'

export const groupSelectors = {
    filterGroups: (groups: GroupEntity[], filters: GroupFilterState): GroupEntity[] => {
        return groups.filter(group => {
            const matchesSearch = !filters.search || 
                group.name.toLowerCase().includes(filters.search.toLowerCase())

            const matchesType = !filters.group_type || 
                group.group_type === filters.group_type

            const matchesParent = filters.parent_id === undefined || 
                group.parent_id === filters.parent_id

            return matchesSearch && matchesType && matchesParent
        })
    },

    sortGroups: (groups: GroupEntity[], sortBy: keyof GroupEntity = 'name'): GroupEntity[] => {
        return [...groups].sort((a, b) => {
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

    getGroupTree: (groups: GroupEntity[]): GroupEntity[] => {
        const rootGroups = groups.filter(g => !g.parent_id)
        const childGroups = groups.filter(g => g.parent_id)
        
        // Simple tree structure - you can enhance this as needed
        return [...rootGroups, ...childGroups]
    }
}