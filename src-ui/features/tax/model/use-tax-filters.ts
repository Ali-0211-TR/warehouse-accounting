import { useState, useMemo } from 'react'
import { taxSelectors } from '@/entities/tax'
import type { TaxEntity, TaxFilterState } from '@/entities/tax'

export function useTaxFilters(taxes: TaxEntity[]) {
    const [filters, setFilters] = useState<TaxFilterState>({
        search: '',
        rate_min: undefined,
        rate_max: undefined,
        is_inclusive: undefined,
        status: undefined
    })

    const filteredTaxes = useMemo(() => {
        return taxSelectors.filterTaxes(taxes, filters)
    }, [taxes, filters])

    const hasActiveFilters = useMemo(() => {
        return filters.search !== '' ||
            filters.rate_min !== undefined ||
            filters.rate_max !== undefined ||
            filters.is_inclusive !== undefined ||
            filters.status !== undefined
    }, [filters])

    const clearFilters = () => {
        setFilters({
            search: '',
            rate_min: undefined,
            rate_max: undefined,
            is_inclusive: undefined,
            status: undefined
        })
    }

    return {
        filters,
        filteredTaxes,
        hasActiveFilters,
        setFilters,
        clearFilters
    }
}