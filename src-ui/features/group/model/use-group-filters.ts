import { useState, useMemo } from 'react'
import { groupSelectors } from '@/entities/group'
import type { GroupEntity, GroupFilterState } from '@/entities/group'

export function useGroupFilters(groups: GroupEntity[]) {
    const [filters, setFilters] = useState<GroupFilterState>({
        search: '',
        group_type: undefined,
        parent_id: undefined
    })

    const filteredGroups = useMemo(() => {
        return groupSelectors.filterGroups(groups, filters)
    }, [groups, filters])

    const hasActiveFilters = useMemo(() => {
        return filters.search !== '' ||
            filters.group_type !== undefined ||
            filters.parent_id !== undefined
    }, [filters])

    const clearFilters = () => {
        setFilters({
            search: '',
            group_type: undefined,
            parent_id: undefined
        })
    }

    return {
        filters,
        filteredGroups,
        hasActiveFilters,
        setFilters,
        clearFilters
    }
}