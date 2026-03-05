import type { TankEntity, TankFilterState } from '@/entities/tank'

export interface TankFeatureConfig {
    permissions: TankPermissions
    ui: TankUIConfig
    defaults: TankDefaults
}

export interface TankPermissions {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canView: boolean
    canBulkDelete: boolean
}

export interface TankUIConfig {
    showFilters: boolean
    showBulkActions: boolean
    pageSize: number
    sortable: boolean
}

export interface TankDefaults {
    protocol: 'Serial' | 'TcpIp' | 'Modbus'
    balance: number
    volume_max: number
}

export interface TankCrudActions {
    onAdd: () => void
    onEdit: (tank: TankEntity) => void
    onDelete: (tank: TankEntity) => void
    onSave: (tank: TankEntity) => Promise<void>
    onCancel: () => void
}

export interface TankFilterActions {
    onShowFilters: () => void
    onHideFilters: () => void
    setFilters: (filters: TankFilterState) => void
    clearFilters: () => void
}

export interface TankListProps {
    tanks: TankEntity[]
    loading?: boolean
    onEdit: (tank: TankEntity) => void
    onDelete: (tank: TankEntity) => void
    selectable?: boolean
    onSelectionChange?: (selected: TankEntity[]) => void
}

export interface TankFormProps {
    visible: boolean
    onHide: () => void
    tank: TankEntity | null
    onSave: (tank: TankEntity) => Promise<void>
}

export interface TankFiltersProps {
    open: boolean
    onClose: () => void
    filters: TankFilterState
    onFiltersChange: (filters: TankFilterState) => void
}