import { useState } from 'react'
import { t } from 'i18next'
import { UserFilterState } from '@/entities/user'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/shared/ui/shadcn/dialog'
import { Button } from '@/shared/ui/shadcn/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Checkbox } from '@/shared/ui/shadcn/checkbox'
import { Badge } from '@/shared/ui/shadcn/badge'
import { X } from 'lucide-react'
import { RoleType } from '@/shared/bindings/RoleType'

interface UserFiltersProps {
    open: boolean
    onClose: () => void
    filters?: UserFilterState
    onFiltersChange?: (filters: UserFilterState) => void
}

const roleOptions: RoleType[] = [
    "Administrator", "Manager", "Seller", "Operator", "Remote"
]

export function UserFilters({
    open,
    onClose,
    filters = { search: '' },
    onFiltersChange
}: UserFiltersProps) {
    const [localFilters, setLocalFilters] = useState<UserFilterState>(filters)

    const handleSearchChange = (value: string) => {
        setLocalFilters(prev => ({ ...prev, search: value }))
    }

    const handleRoleToggle = (role: RoleType) => {
        setLocalFilters(prev => {
            const currentRoles = prev.roles || []
            const newRoles = currentRoles.includes(role)
                ? currentRoles.filter(r => r !== role)
                : [...currentRoles, role]

            return { ...prev, roles: newRoles.length > 0 ? newRoles : undefined }
        })
    }

    const handleApply = () => {
        onFiltersChange?.(localFilters)
        onClose()
    }

    const handleReset = () => {
        const resetFilters = { search: '' }
        setLocalFilters(resetFilters)
        onFiltersChange?.(resetFilters)
    }

    const handleCancel = () => {
        setLocalFilters(filters)
        onClose()
    }

    const hasActiveFilters = localFilters.search !== '' || (localFilters.roles && localFilters.roles.length > 0)

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('user.filters')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Search Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="search">{t('control.search')}</Label>
                        <Input
                            id="search"
                            placeholder={t('user.search_placeholder')}
                            value={localFilters.search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>

                    {/* Role Filters */}
                    <div className="space-y-3">
                        <Label>{t('user.roles')}</Label>

                        {/* Selected Roles */}
                        {localFilters.roles && localFilters.roles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {localFilters.roles.map(role => (
                                    <Badge key={role} variant="secondary" className="text-xs">
                                        {t(`lists.role_type.${role}`)}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 ml-1"
                                            onClick={() => handleRoleToggle(role)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Role Options */}
                        <div className="grid grid-cols-2 gap-3">
                            {roleOptions.map(role => (
                                <div key={role} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={role}
                                        checked={localFilters.roles?.includes(role) || false}
                                        onCheckedChange={() => handleRoleToggle(role)}
                                    />
                                    <Label htmlFor={role} className="text-sm">
                                        {t(`lists.role_type.${role}`)}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <div className="flex justify-between w-full">
                        <Button
                            variant="ghost"
                            onClick={handleReset}
                            disabled={!hasActiveFilters}
                        >
                            {t('control.reset')}
                        </Button>
                        <div className="space-x-2">
                            <Button variant="outline" onClick={handleCancel}>
                                {t('control.cancel')}
                            </Button>
                            <Button onClick={handleApply}>
                                {t('control.apply')}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}