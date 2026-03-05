import { DispenserPortList, DispenserPortForm, DispenserPortFilters, useDispenserPort } from '@/features/dispenser-port'
import { PageHeader } from '@/shared/ui/components/PageHeader'
import { ConfirmationDialog } from '@/shared/ui/components/ConfirmationDialog'
import { useState } from 'react'
import { t } from 'i18next'
import useToast from '@/shared/hooks/use-toast'
import type { DispenserPortEntity } from '@/entities/dispenser-port'
import React from 'react'

export function DispenserPortManagement() {
    const { showErrorToast, showSuccessToast } = useToast()
    const [selectedItems, setSelectedItems] = useState<DispenserPortEntity[]>([])
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

    const {
        dispenserPorts,
        selectedDispenserPort,
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
    } = useDispenserPort()

    // Handle bulk delete
    const handleBulkDelete = async () => {
        try {
            for (const dispenserPort of selectedItems) {
                if (dispenserPort.id) {
                    await onDelete(dispenserPort)
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

    // This will be called by EntityTable whenever selection changes
    const handleSelectionChange = React.useCallback((selected: DispenserPortEntity[]) => {
        setSelectedItems(selected)
    }, [])

    return (
        <div className="flex flex-col gap-2">
            <div className="flex bg-background border rounded-lg py-2 px-4 items-center justify-between">
                <PageHeader
                    title="menu.dictionary.dispenser_ports"
                    hasActiveFilters={hasActiveFilters}
                    onShowFilters={onShowFilters}
                    onAdd={onAdd}
                    clearFilters={clearFilters}
                    selectedCount={selectedItems.length}
                    onBulkDelete={() => setBulkDeleteOpen(true)}
                    addButtonText="control.add_dispenser_port"
                />
            </div>
            <DispenserPortList
                dispenserPorts={dispenserPorts}
                loading={loading}
                onEdit={onEdit}
                onDelete={onDelete}
                selectable={true}
                onSelectionChange={handleSelectionChange}
            />


            {/* Filters Dialog */}
            <DispenserPortFilters
                open={filtersVisible}
                onClose={onHideFilters}
                filters={filters}
                onFiltersChange={setFilters}
            />

            {formVisible && (
                <DispenserPortForm
                    visible={formVisible}
                    onHide={onCancel}
                    dispenserPort={selectedDispenserPort}
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