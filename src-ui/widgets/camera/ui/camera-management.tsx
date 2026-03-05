import { CameraList, CameraForm, CameraFilters, useCamera } from '@/features/camera'
import { PageHeader } from '@/shared/ui/components/PageHeader'
import { ConfirmationDialog } from '@/shared/ui/components/ConfirmationDialog'
import { useState } from 'react'
import { t } from 'i18next'
import useToast from '@/shared/hooks/use-toast'
import type { CameraEntity } from '@/entities/camera'
import React from 'react'

export function CameraManagement() {
    const { showErrorToast, showSuccessToast } = useToast()
    const [selectedItems, setSelectedItems] = useState<CameraEntity[]>([])
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

    const {
        cameras,
        selectedCamera,
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
    } = useCamera()

    // Handle bulk delete
    const handleBulkDelete = async () => {
        try {
            for (const camera of selectedItems) {
                if (camera.id) {
                    await onDelete(camera)
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

    const handleSelectionChange = React.useCallback((selected: CameraEntity[]) => {
        setSelectedItems(selected)
    }, [])

    return (
        <div className="flex flex-col gap-2">
            <div className="flex bg-background border rounded-lg py-2 px-4 items-center justify-between">
                <PageHeader
                    title="menu.dictionary.cameras"
                    hasActiveFilters={hasActiveFilters}
                    onShowFilters={onShowFilters}
                    onAdd={onAdd}
                    clearFilters={clearFilters}
                    selectedCount={selectedItems.length} // This will now show the correct count
                    onBulkDelete={() => setBulkDeleteOpen(true)}
                />
            </div>
            <CameraList
                cameras={cameras}
                loading={loading}
                onEdit={onEdit}
                onDelete={onDelete}
                selectable={true}
                onSelectionChange={handleSelectionChange}
            />

            {/* Filters Dialog */}
            <CameraFilters
                open={filtersVisible}
                onClose={onHideFilters}
                filters={filters}
                onFiltersChange={setFilters}
            />

            {formVisible && (
                <CameraForm
                    visible={formVisible}
                    onHide={onCancel}
                    camera={selectedCamera}
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