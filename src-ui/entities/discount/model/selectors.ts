import type { DiscountEntity, DiscountFilterState } from './types'

export const discountSelectors = {
    filterDiscounts: (discounts: DiscountEntity[], filters: DiscountFilterState): DiscountEntity[] => {
        return discounts.filter(discount => {
            const matchesSearch = !filters.search || 
                discount.name.toLowerCase().includes(filters.search.toLowerCase())

            const matchesType = !filters.discount_type || 
                discount.discount_type === filters.discount_type

            const matchesProductType = !filters.product_type || 
                discount.product_type === filters.product_type

            const matchesBoundType = !filters.bound_type || 
                discount.discount_bound_type === filters.bound_type

            return matchesSearch && matchesType && matchesProductType && matchesBoundType
        })
    },

    sortDiscounts: (discounts: DiscountEntity[], sortBy: keyof DiscountEntity = 'name'): DiscountEntity[] => {
        return [...discounts].sort((a, b) => {
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