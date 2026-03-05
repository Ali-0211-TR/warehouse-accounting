import type { DispenserEntity as DispenserEntityBinding } from '@/shared/bindings/DispenserEntity'
import type { NozzleEntity as NozzleEntityBinding } from '@/shared/bindings/NozzleEntity'
import type { DispenserDTO } from '@/shared/bindings/DispenserDTO'
import type { DispenserFuelingState } from '@/shared/bindings/DispenserFuelingState'
import type { DispenserState } from '@/shared/bindings/DispenserState'

export type DispenserEntity = DispenserEntityBinding
export type NozzleEntity = NozzleEntityBinding

export interface DispenserFilterState {
    search: string
    fueling_state?: DispenserFuelingState
    state?: DispenserState
    has_camera?: boolean
}

export { DispenserDTO, DispenserFuelingState, DispenserState }