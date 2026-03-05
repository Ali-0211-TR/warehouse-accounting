import { useState, useMemo } from 'react'
import { discountSelectors } from '@/entities/discount'
import type { DiscountEntity, DiscountFilterState } from '@/entities/discount'

export function useDiscountFilters(discounts: DiscountEntity[]) {
    const [filters, setFilters] = useState<DiscountFilterState>({
        search: '',
        discount_type: undefined,
        product_type: undefined,
        bound_type: undefined
    })

    const filteredDiscounts = useMemo(() => {
        return discountSelectors.filterDiscounts(discounts, filters)
    }, [discounts, filters])

    const hasActiveFilters = useMemo(() => {
        return filters.search !== '' ||
            filters.discount_type !== undefined ||
            filters.product_type !== undefined ||
            filters.bound_type !== undefined
    }, [filters])

    const clearFilters = () => {
        setFilters({
            search: '',
            discount_type: undefined,
            product_type: undefined,
            bound_type: undefined
        })
    }

    return {
        filters,
        filteredDiscounts,
        hasActiveFilters,
        setFilters,
        clearFilters
    }
}