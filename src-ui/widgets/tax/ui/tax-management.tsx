import { TaxList, TaxForm, TaxFilters, useTax } from '@/features/tax'
import { PageHeader } from '@/shared/ui/components/PageHeader'
import { ConfirmationDialog } from '@/shared/ui/components/ConfirmationDialog'
import { useState } from 'react'
import { t } from 'i18next'
import useToast from '@/shared/hooks/use-toast'
import type { TaxEntity } from '@/entities/tax'
import React from 'react'

export function TaxManagement() {
    const { showErrorToast, showSuccessToast } = useToast()
    const [selectedItems, setSelectedItems] = useState<TaxEntity[]>([])
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

    const {
        taxes,
        selectedTax,
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
    } = useTax()

    // Handle bulk delete
    const handleBulkDelete = async () => {
        try {
            for (const tax of selectedItems) {
                if (tax.id) {
                    await onDelete(tax)
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

    const handleSelectionChange = React.useCallback((selected: TaxEntity[]) => {
        setSelectedItems(selected)
    }, [])

    return (
        <div className="flex flex-col gap-2">
            <div className="flex bg-background border rounded-lg py-2 px-4 items-center justify-between">
                <PageHeader
                    title="menu.dictionary.taxes"
                    hasActiveFilters={hasActiveFilters}
                    onShowFilters={onShowFilters}
                    onAdd={onAdd}
                    clearFilters={clearFilters}
                    selectedCount={selectedItems.length}
                    onBulkDelete={() => setBulkDeleteOpen(true)}
                />
            </div>
            <TaxList
                taxes={taxes}
                loading={loading}
                onEdit={onEdit}
                onDelete={onDelete}
                selectable={true}
                onSelectionChange={handleSelectionChange}
            />


            {/* Filters Dialog */}
            <TaxFilters
                open={filtersVisible}
                onClose={onHideFilters}
                filters={filters}
                onFiltersChange={setFilters}
            />

            {formVisible && (
                <TaxForm
                    visible={formVisible}
                    onHide={onCancel}
                    tax={selectedTax}
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