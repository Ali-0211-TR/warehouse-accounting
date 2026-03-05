import type { ProductEntity } from '@/shared/bindings/ProductEntity'
import type { TankDTO } from '@/shared/bindings/TankDTO'
import type { TankEntity as TankEntityBinding } from '@/shared/bindings/TankEntity'
import type { TankProtocolType } from '@/shared/bindings/TankProtocolType'

export type TankEntity = TankEntityBinding

export interface TankFilterState {
    // search by tank name
    search: string
    // filter tanks by product id. If undefined, no product filtering is applied.
    product_id?: string
}

export { ProductEntity, TankDTO, TankProtocolType }

