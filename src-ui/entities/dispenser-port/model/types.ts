import type { DispenserPortEntity as DispenserPortEntityBinding } from '@/shared/bindings/DispenserPortEntity'
import type { DispenserProtocolType } from '@/shared/bindings/DispenserProtocolType'

export type DispenserPortEntity = DispenserPortEntityBinding

export interface DispenserPortFilterState {
    search: string
    protocol?: DispenserProtocolType
    port_speed?: number
}

export { DispenserProtocolType }