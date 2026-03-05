import type { TankEntity } from "@/entities/tank";
import { TankFilters, TankForm, TankList, useTank } from "@/features/tank";
import useToast from "@/shared/hooks/use-toast";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { PageHeader } from "@/shared/ui/components/PageHeader";
import { t } from "i18next";
import React, { useState } from "react";

export function TankManagement() {
  const { showErrorToast, showSuccessToast } = useToast();
  const [selectedItems, setSelectedItems] = useState<TankEntity[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const {
    tanks,
    selectedTank,
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
    clearFilters,
  } = useTank();

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      for (const tank of selectedItems) {
        if (tank.id) {
          await onDelete(tank);
        }
      }
      showSuccessToast(t("success.data_deleted"));
      setSelectedItems([]);
      setBulkDeleteOpen(false);
    } catch (error: any) {
      showErrorToast(error.message);
      setBulkDeleteOpen(false);
    }
  };

  // This will be called by EntityTable whenever selection changes
  const handleSelectionChange = React.useCallback((selected: TankEntity[]) => {
    setSelectedItems(selected);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex bg-background border rounded-lg py-2 px-4 items-center justify-between">
        <PageHeader
          title="menu.dictionary.tanks"
          hasActiveFilters={hasActiveFilters}
          onShowFilters={onShowFilters}
          onAdd={onAdd}
          clearFilters={clearFilters}
          selectedCount={selectedItems.length}
          onBulkDelete={() => setBulkDeleteOpen(true)}
          addButtonText="control.add_tank"
        />
      </div>
      <TankList
        tanks={tanks}
        loading={loading}
        onEdit={onEdit}
        onDelete={onDelete}
        selectable={true}
        onSelectionChange={handleSelectionChange}
      />

      {/* Filters Dialog */}
      <TankFilters
        open={filtersVisible}
        onClose={onHideFilters}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {formVisible && (
        <TankForm
          visible={formVisible}
          onHide={onCancel}
          tank={selectedTank}
          onSave={onSave}
        />
      )}

      {/* Bulk Delete Confirmation */}
      <ConfirmationDialog
        open={bulkDeleteOpen}
        title={t("message.confirm_bulk_delete")}
        description={
          <>
            {t("message.bulk_delete_warning", { count: selectedItems.length })}
            <br />
            <span className="text-red-600 font-medium">
              {t("message.action_irreversible")}
            </span>
          </>
        }
        confirmLabel={`${t("control.delete")} (${selectedItems.length})`}
        cancelLabel={t("control.cancel")}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        confirmClassName="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}
