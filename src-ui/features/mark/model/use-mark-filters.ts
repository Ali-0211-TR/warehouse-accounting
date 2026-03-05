import { useState, useMemo } from 'react'
import { markSelectors } from '@/entities/mark'
import type { MarkEntity, MarkFilterState } from '@/entities/mark'

export function useMarkFilters(marks: MarkEntity[]) {
    const [filters, setFilters] = useState<MarkFilterState>({
        search: '',
        category: undefined
    })

    const filteredMarks = useMemo(() => {
        return markSelectors.filterMarks(marks, filters)
    }, [marks, filters])

    const hasActiveFilters = useMemo(() => {
        return filters.search !== '' ||
            filters.category !== undefined
    }, [filters])

    const clearFilters = () => {
        setFilters({
            search: '',
            category: undefined
        })
    }

    return {
        filters,
        filteredMarks,
        hasActiveFilters,
        setFilters,
        clearFilters
    }
}