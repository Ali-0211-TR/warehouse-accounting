import type { UnitEntity as UnitEntityBinding } from '@/shared/bindings/UnitEntity'
import type { UnitDTO } from '@/shared/bindings/UnitDTO'

export type UnitEntity = UnitEntityBinding

export interface UnitFilterState {
    search: string
    category?: 'volume' | 'weight' | 'length' | 'other'
}

export { UnitDTO }