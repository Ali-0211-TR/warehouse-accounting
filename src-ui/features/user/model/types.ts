import { UserEntity, UserFilterState } from "@/entities/user"

// Main feature configuration
export interface UserFeatureConfig {
    permissions?: UserPermissions
    ui?: UserUIConfig
    defaults?: UserDefaults
}

export interface UserPermissions {
    canCreate?: boolean
    canEdit?: boolean
    canDelete?: boolean
    canManageRoles?: boolean
    canViewAll?: boolean
}

export interface UserUIConfig {
    // List settings
    showActions?: boolean
    compact?: boolean
    pageSize?: number

    // Form settings
    showRoles?: boolean
    requiredFields?: string[]

    // Filter settings
    enableFilters?: boolean
    enableRoleFilter?: boolean
    enableSearch?: boolean
}

export interface UserDefaults {
    filters?: UserFilterState
    roles?: string[]
    formValues?: Partial<UserEntity>
}

// Action interfaces
export interface UserCrudActions {
    onAdd: () => void
    onEdit: (user: UserEntity) => void
    onDelete: (user: UserEntity) => void
    onSave: (user: UserEntity) => Promise<void>
    onCancel: () => void
}

export interface UserFilterActions {
    onFiltersChange: (filters: UserFilterState) => void
    onClearFilters: () => void
    onShowFilters: () => void
    onHideFilters: () => void
}

// Component props
export interface UserListProps {
    users: UserEntity[]
    loading?: boolean
    config?: UserUIConfig
    actions?: Partial<UserCrudActions>
}

export interface UserFormProps {
    visible: boolean
    user: UserEntity | null
    config?: UserUIConfig
    onSave: (user: UserEntity) => Promise<void>
    onCancel: () => void
}

export interface UserFiltersProps {
    open: boolean
    filters: UserFilterState
    config?: UserUIConfig
    actions: UserFilterActions
}

// Legacy types for backward compatibility
export interface UserCrudConfig extends UserUIConfig {
    onUserSelect?: (user: UserEntity) => void
    multiSelect?: boolean
}