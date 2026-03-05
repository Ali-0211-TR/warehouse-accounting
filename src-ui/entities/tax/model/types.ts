import type { TaxEntity as TaxEntityBinding } from '@/shared/bindings/TaxEntity'
import type { TaxDTO } from '@/shared/bindings/TaxDTO'

export type TaxEntity = TaxEntityBinding

export interface TaxFilterState {
    search: string
    rate_min?: number
    rate_max?: number
    is_inclusive?: boolean
    status?: 'active' | 'pending'
}

export { TaxDTO }