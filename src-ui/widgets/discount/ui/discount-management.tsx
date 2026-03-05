import {
  DiscountList,
  DiscountForm,
  DiscountFilters,
  useDiscount,
} from "@/features/discount";
import { PageHeader } from "@/shared/ui/components/PageHeader";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { useState } from "react";
import { t } from "i18next";
import useToast from "@/shared/hooks/use-toast";
import type { DiscountEntity } from "@/entities/discount";
import React from "react";

export function DiscountManagement() {
  const { showErrorToast, showSuccessToast } = useToast();
  const [selectedItems, setSelectedItems] = useState<DiscountEntity[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const {
    discounts,
    selectedDiscount,
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
  } = useDiscount();

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      for (const discount of selectedItems) {
        if (discount.id) {
          await onDelete(discount);
        }
      }
      showSuccessToast(t("success.data_deleted"));
      setSelectedItems([]); // Clear selection after successful delete
      setBulkDeleteOpen(false);
    } catch (error: any) {
      showErrorToast(error.message);
      setBulkDeleteOpen(false);
    }
  };

  // This will be called by EntityTable whenever selection changes
  const handleSelectionChange = React.useCallback(
    (selected: DiscountEntity[]) => {
      setSelectedItems(selected);
    },
    [],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex bg-background border rounded-lg py-2 px-4 items-center justify-between">
        <PageHeader
          title="menu.dictionary.discounts"
          hasActiveFilters={hasActiveFilters}
          onShowFilters={onShowFilters}
          onAdd={onAdd}
          clearFilters={clearFilters}
          selectedCount={selectedItems.length} // This will now show the correct count
          onBulkDelete={() => setBulkDeleteOpen(true)}
        />
      </div>
      <DiscountList
        discounts={discounts}
        loading={loading}
        onEdit={onEdit}
        onDelete={onDelete}
        selectable={true}
        onSelectionChange={handleSelectionChange} // Pass the handler
      />

      {/* Filters Dialog */}
      <DiscountFilters
        open={filtersVisible}
        onClose={onHideFilters}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {formVisible && (
        <DiscountForm
          visible={formVisible}
          onHide={onCancel}
          discount={selectedDiscount}
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
