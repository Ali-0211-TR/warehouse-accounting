import type { DiscountEntity as DiscountEntityBinding } from '@/shared/bindings/DiscountEntity'
import type { DiscountDTO } from '@/shared/bindings/DiscountDTO'
import type { DiscountType } from '@/shared/bindings/DiscountType'
import type { DiscountBoundType } from '@/shared/bindings/DiscountBoundType'
import type { DiscountUnitType } from '@/shared/bindings/DiscountUnitType'
import type { ProductType } from '@/shared/bindings/ProductType'

export type DiscountEntity = DiscountEntityBinding

export interface DiscountFilterState {
    search: string
    discount_type?: DiscountType
    product_type?: ProductType
    bound_type?: DiscountBoundType
}

export { DiscountDTO, DiscountType, DiscountBoundType, DiscountUnitType, ProductType }