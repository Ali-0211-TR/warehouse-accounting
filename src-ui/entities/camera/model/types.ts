import type { CameraEntity as CameraEntityBinding } from '@/shared/bindings/CameraEntity'
import type { CameraDTO } from '@/shared/bindings/CameraDTO'
import type { CameraType } from '@/shared/bindings/CameraType'

export type CameraEntity = CameraEntityBinding

export interface CameraFilterState {
    search: string
    camera_type?: CameraType
}

export { CameraDTO, CameraType }