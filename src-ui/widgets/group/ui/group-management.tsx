import { GroupList, GroupForm, GroupFilters, useGroup } from '@/features/group'
import { PageHeader } from '@/shared/ui/components/PageHeader'
import { ConfirmationDialog } from '@/shared/ui/components/ConfirmationDialog'
import { useState } from 'react'
import { t } from 'i18next'
import useToast from '@/shared/hooks/use-toast'
import type { GroupEntity } from '@/entities/group'
import React from 'react'

export function GroupManagement() {
    const { showErrorToast, showSuccessToast } = useToast()
    const [selectedItems, setSelectedItems] = useState<GroupEntity[]>([])
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

    const {
        groups,
        selectedGroup,
        formVisible,
        filtersVisible,
        loading,
        hasActiveFilters,
        onAdd,
        onEdit,
        onDelete,
        onSave,
        onCancel,
        onShowFilters,
        onHideFilters,
        filters,
        setFilters,
        clearFilters
    } = useGroup()

    // Handle bulk delete
    const handleBulkDelete = async () => {
        try {
            for (const group of selectedItems) {
                if (group.id) {
                    await onDelete(group)
                }
            }
            showSuccessToast(t('success.data_deleted'))
            setSelectedItems([])
            setBulkDeleteOpen(false)
        } catch (error: any) {
            showErrorToast(error.message)
            setBulkDeleteOpen(false)
        }
    }

    const handleSelectionChange = React.useCallback((selected: GroupEntity[]) => {
        setSelectedItems(selected)
    }, [])

    return (
        <div className="flex flex-col gap-2">
            <div className="flex bg-background border rounded-lg py-2 px-4 items-center justify-between">
                <PageHeader
                    title="menu.dictionary.groups"
                    hasActiveFilters={hasActiveFilters}
                    onShowFilters={onShowFilters}
                    onAdd={onAdd}
                    clearFilters={clearFilters}
                    selectedCount={selectedItems.length}
                    onBulkDelete={() => setBulkDeleteOpen(true)}
                />
            </div>
            <GroupList
                groups={groups}
                loading={loading}
                onEdit={onEdit}
                onDelete={onDelete}
                selectable={true}
                onSelectionChange={handleSelectionChange}
            />

            {/* Filters Dialog */}
            <GroupFilters
                open={filtersVisible}
                onClose={onHideFilters}
                filters={filters}
                onFiltersChange={setFilters}
            />

            {formVisible && (
                <GroupForm
                    visible={formVisible}
                    onHide={onCancel}
                    group={selectedGroup}
                    onSave={onSave}
                />
            )}

            {/* Bulk Delete Confirmation */}
            <ConfirmationDialog
                open={bulkDeleteOpen}
                title={t('message.confirm_bulk_delete')}
                description={
                    <>
                        {t('message.bulk_delete_warning', { count: selectedItems.length })}
                        <br />
                        <span className="text-red-600 font-medium">
                            {t('message.action_irreversible')}
                        </span>
                    </>
                }
                confirmLabel={`${t('control.delete')} (${selectedItems.length})`}
                cancelLabel={t('control.cancel')}
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteOpen(false)}
                confirmClassName="bg-red-600 hover:bg-red-700"
            />
        </div>
    )
}