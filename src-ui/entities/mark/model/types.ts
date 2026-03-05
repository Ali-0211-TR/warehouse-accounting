import type { MarkEntity as MarkEntityBinding } from '@/shared/bindings/MarkEntity'
import type { MarkDTO } from '@/shared/bindings/MarkDTO'

export type MarkEntity = MarkEntityBinding

export type MarkCategory = 'premium' | 'eco' | 'standard' | 'vip' | 'other'

export interface MarkFilterState {
    search: string
    category?: MarkCategory
}

export { MarkDTO }