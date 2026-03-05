import type { DispenserPortEntity, DispenserPortFilterState } from '@/entities/dispenser-port'

export interface DispenserPortFeatureConfig {
    permissions: DispenserPortPermissions
    ui: DispenserPortUIConfig
    defaults: DispenserPortDefaults
}

export interface DispenserPortPermissions {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canView: boolean
    canBulkDelete: boolean
}

export interface DispenserPortUIConfig {
    showFilters: boolean
    showBulkActions: boolean
    pageSize: number
    sortable: boolean
}

export interface DispenserPortDefaults {
    protocol: 'Wayne' | 'Gilbarco' | 'Tokheim'
    port_speed: number
}

export interface DispenserPortCrudActions {
    onAdd: () => void
    onEdit: (dispenserPort: DispenserPortEntity) => void
    onDelete: (dispenserPort: DispenserPortEntity) => void
    onSave: (dispenserPort: DispenserPortEntity) => Promise<void>
    onCancel: () => void
}

export interface DispenserPortFilterActions {
    onShowFilters: () => void
    onHideFilters: () => void
    setFilters: (filters: DispenserPortFilterState) => void
    clearFilters: () => void
}

export interface DispenserPortListProps {
    dispenserPorts: DispenserPortEntity[]
    loading?: boolean
    onEdit: (dispenserPort: DispenserPortEntity) => void
    onDelete: (dispenserPort: DispenserPortEntity) => void
    selectable?: boolean
    onSelectionChange?: (selected: DispenserPortEntity[]) => void
}

export interface DispenserPortFormProps {
    visible: boolean
    onHide: () => void
    dispenserPort: DispenserPortEntity | null
    onSave: (dispenserPort: DispenserPortEntity) => Promise<void>
}

export interface DispenserPortFiltersProps {
    open: boolean
    onClose: () => void
    filters: DispenserPortFilterState
    onFiltersChange: (filters: DispenserPortFilterState) => void
}