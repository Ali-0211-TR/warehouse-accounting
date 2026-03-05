import type { DiscountEntity, DiscountFilterState } from '@/entities/discount'

export interface DiscountFeatureConfig {
    permissions: DiscountPermissions
    ui: DiscountUIConfig
    defaults: DiscountDefaults
}

export interface DiscountPermissions {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canView: boolean
    canBulkDelete: boolean
}

export interface DiscountUIConfig {
    showFilters: boolean
    showBulkActions: boolean
    pageSize: number
    sortable: boolean
}

export interface DiscountDefaults {
    discount_type: 'Percentage' | 'Fixed'
    discount_bound_type: 'Volume' | 'Amount'
    discount_unit_type: 'Liter' | 'Piece'
}

export interface DiscountCrudActions {
    onAdd: () => void
    onEdit: (discount: DiscountEntity) => void
    onDelete: (discount: DiscountEntity) => void
    onSave: (discount: DiscountEntity) => Promise<void>
    onCancel: () => void
}

export interface DiscountFilterActions {
    onShowFilters: () => void
    onHideFilters: () => void
    setFilters: (filters: DiscountFilterState) => void
    clearFilters: () => void
}

export interface DiscountListProps {
    discounts: DiscountEntity[]
    loading?: boolean
    onEdit: (discount: DiscountEntity) => void
    onDelete: (discount: DiscountEntity) => void
    onBulkDelete?: (discounts: DiscountEntity[]) => void
}

export interface DiscountFormProps {
    visible: boolean
    onHide: () => void
    discount: DiscountEntity | null
    onSave: (discount: DiscountEntity) => Promise<void>
}

export interface DiscountFiltersProps {
    open: boolean
    onClose: () => void
    filters: DiscountFilterState
    onFiltersChange: (filters: DiscountFilterState) => void
}