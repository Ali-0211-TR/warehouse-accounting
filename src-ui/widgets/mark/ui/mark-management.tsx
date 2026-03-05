import { MarkList, MarkForm, MarkFilters, useMark } from "@/features/mark";
import { PageHeader } from "@/shared/ui/components/PageHeader";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { useState } from "react";
import { t } from "i18next";
import useToast from "@/shared/hooks/use-toast";
import type { MarkEntity } from "@/entities/mark";
import React from "react";

export function MarkManagement() {
  const { showErrorToast, showSuccessToast } = useToast();
  const [selectedItems, setSelectedItems] = useState<MarkEntity[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const {
    marks,
    selectedMark,
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
  } = useMark();

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      for (const mark of selectedItems) {
        if (mark.id) {
          await onDelete(mark);
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

  const handleSelectionChange = React.useCallback((selected: MarkEntity[]) => {
    setSelectedItems(selected);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex bg-background border rounded-lg py-2 px-4 items-center justify-between">
        <PageHeader
          title="menu.dictionary.marks"
          hasActiveFilters={hasActiveFilters}
          onShowFilters={onShowFilters}
          onAdd={onAdd}
          clearFilters={clearFilters}
          selectedCount={selectedItems.length}
          onBulkDelete={() => setBulkDeleteOpen(true)}
        />
      </div>
      <MarkList
        marks={marks}
        loading={loading}
        onEdit={onEdit}
        onDelete={onDelete}
        selectable={true}
        onSelectionChange={handleSelectionChange}
      />

      {/* Filters Dialog */}
      <MarkFilters
        open={filtersVisible}
        onClose={onHideFilters}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {formVisible && (
        <MarkForm
          visible={formVisible}
          onHide={onCancel}
          mark={selectedMark}
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
