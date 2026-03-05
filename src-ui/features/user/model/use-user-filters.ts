import { useState, useMemo } from 'react'
import { UserEntity, UserFilterState, userSelectors } from '@/entities/user'

export function useUserFilters(users: UserEntity[]) {
    const [filters, setFilters] = useState<UserFilterState>({ search: '' })
    const [dialogOpen, setDialogOpen] = useState(false)

    const filteredUsers = useMemo(() =>
        userSelectors.filterUsers(users, filters),
        [users, filters]
    )

    const hasActiveFilters = useMemo<boolean>(() => {
        return Boolean(filters.search) || Boolean(filters.roles && filters.roles.length > 0)
    }, [filters])

    const clearFilters = () => {
        setFilters({ search: '' })
    }

    return {
        filters,
        filteredUsers,
        hasActiveFilters,
        dialogOpen,
        setFilters,
        setDialogOpen,
        clearFilters
    }
}