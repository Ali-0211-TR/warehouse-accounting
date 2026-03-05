import type { DispenserEntity, DispenserFilterState } from '@/entities/dispenser'

export interface DispenserFeatureConfig {
    permissions: DispenserPermissions
    ui: DispenserUIConfig
    defaults: DispenserDefaults
}

export interface DispenserPermissions {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canView: boolean
    canBulkDelete: boolean
}

export interface DispenserUIConfig {
    showFilters: boolean
    showBulkActions: boolean
    pageSize: number
    sortable: boolean
}

export interface DispenserDefaults {
    fueling_state: 'Idle' | 'Fueling' | 'Complete' | 'Error'
    state: 'Online' | 'Offline' | 'Error'
    base_address: number
}

export interface DispenserCrudActions {
    onAdd: () => void
    onEdit: (dispenser: DispenserEntity) => void
    onDelete: (dispenser: DispenserEntity) => void
    onSave: (dispenser: DispenserEntity) => Promise<void>
    onCancel: () => void
}

export interface DispenserFilterActions {
    onShowFilters: () => void
    onHideFilters: () => void
    setFilters: (filters: DispenserFilterState) => void
    clearFilters: () => void
}

export interface DispenserListProps {
    dispensers: DispenserEntity[]
    loading?: boolean
    onEdit: (dispenser: DispenserEntity) => void
    onDelete: (dispenser: DispenserEntity) => void
    selectable?: boolean
    onSelectionChange?: (selected: DispenserEntity[]) => void
}

export interface DispenserFormProps {
    visible: boolean
    onHide: () => void
    dispenser: DispenserEntity | null
    onSave: (dispenser: DispenserEntity) => Promise<void>
}

export interface DispenserFiltersProps {
    open: boolean
    onClose: () => void
    filters: DispenserFilterState
    onFiltersChange: (filters: DispenserFilterState) => void
}