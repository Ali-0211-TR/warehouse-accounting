import type { GroupEntity, GroupFilterState } from '@/entities/group'

export interface GroupFeatureConfig {
    permissions: GroupPermissions
    ui: GroupUIConfig
    defaults: GroupDefaults
}

export interface GroupPermissions {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canView: boolean
    canBulkDelete: boolean
}

export interface GroupUIConfig {
    showFilters: boolean
    showBulkActions: boolean
    pageSize: number
    sortable: boolean
}

export interface GroupDefaults {
    group_type: 'Client' | 'Product' | 'Car'
}

export interface GroupCrudActions {
    onAdd: () => void
    onEdit: (group: GroupEntity) => void
    onDelete: (group: GroupEntity) => void
    onSave: (group: GroupEntity) => Promise<void>
    onCancel: () => void
}

export interface GroupFilterActions {
    onShowFilters: () => void
    onHideFilters: () => void
    setFilters: (filters: GroupFilterState) => void
    clearFilters: () => void
}

export interface GroupListProps {
    groups: GroupEntity[]
    loading?: boolean
    onEdit: (group: GroupEntity) => void
    onDelete: (group: GroupEntity) => void
    onBulkDelete?: (groups: GroupEntity[]) => void
}

export interface GroupFormProps {
    visible: boolean
    onHide: () => void
    group: GroupEntity | null
    onSave: (group: GroupEntity) => Promise<void>
}

export interface GroupFiltersProps {
    open: boolean
    onClose: () => void
    filters: GroupFilterState
    onFiltersChange: (filters: GroupFilterState) => void
}