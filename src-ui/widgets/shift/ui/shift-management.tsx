import type { ShiftEntity } from "@/entities/shift";
import { ShiftList, useShift } from "@/features/shift";
import { CloseShiftForm } from "@/features/shift/ui/close-shift-form";
import { OpenShiftForm } from "@/features/shift/ui/open-shift-form";
import { ShiftFilters } from "@/features/shift/ui/shift-filters";
import useToast from "@/shared/hooks/use-toast";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { PageHeader } from "@/shared/ui/components/PageHeader";
import { Button } from "@/shared/ui/shadcn/button";
import { t } from "i18next";
import { Clock } from "lucide-react";
import React, { useState } from "react";

export function ShiftManagement() {
  const { showErrorToast, showSuccessToast } = useToast();
  const [selectedItems, setSelectedItems] = useState<ShiftEntity[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [sortField, setSortField] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<1 | -1>(1);

  const {
    shifts,
    currentShift,
    loading,
    filtersVisible,
    openShiftVisible,
    closeShiftVisible,
    hasActiveFilters,
    pagination,
    onDelete,
    onOpenShift,
    onCloseShift,
    onCancel,
    onOpenShiftSubmit,
    onCloseShiftSubmit,
    onShowFilters,
    onHideFilters,
    filters,
    setFilters,
    clearFilters,
    pageChange,
    onSort,
  } = useShift();
  //TODO: Fix shift list make ti automatically filled when close and open get data from devices
  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      for (const shift of selectedItems) {
        if (shift.id) {
          await onDelete(shift);
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

  const handleSelectionChange = React.useCallback((selected: ShiftEntity[]) => {
    setSelectedItems(selected);
  }, []);

  const handleSortChange = React.useCallback(
    (field: string, order: 1 | -1) => {
      setSortField(field);
      setSortOrder(order);
      onSort(field, order);
    },
    [onSort]
  );

  const sortFields = [
    { value: "id", label: t("shift.id") },
    { value: "user_open", label: t("shift.user_open") },
    { value: "d_open", label: t("shift.d_open") },
    { value: "d_close", label: t("shift.d_close") },
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* Current Shift Status */}

      <div className="flex bg-background border rounded-lg py-2 px-4 items-center justify-between">
        <PageHeader
          title="menu.main.shifts"
          hasActiveFilters={hasActiveFilters}
          onShowFilters={onShowFilters}
          onAdd={onOpenShift}
          clearFilters={clearFilters}
          selectedCount={selectedItems.length}
          onBulkDelete={() => setBulkDeleteOpen(true)}
          showAddButton={false}
          showSort={true}
          sortField={sortField}
          sortOrder={sortOrder}
          sortFields={sortFields}
          onSortChange={handleSortChange}
        />
        {!currentShift ? (
          <Button
            onClick={onOpenShift}
            className="bg-green-600 hover:bg-green-700"
          >
            <Clock className="h-4 w-4 mr-2" />
            {t("shift.open_shift")}
          </Button>
        ) : (
          <Button

            onClick={onCloseShift}
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            {t("shift.close_shift")}
          </Button>
        )}
      </div>
      <ShiftList
        shifts={shifts}
        loading={loading}
        pagination={pagination}
        onPageChange={pageChange}
        // onPageSizeChange={onPageSizeChange}
        onSort={onSort}
        selectable={true}
        onSelectionChange={handleSelectionChange}
      />

      {/* Filters Dialog */}
      <ShiftFilters
        open={filtersVisible}
        onClose={onHideFilters}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Open Shift Form */}
      <OpenShiftForm
        open={openShiftVisible}
        onClose={onCancel}
        onSubmit={onOpenShiftSubmit}
      />

      {/* Close Shift Form */}
      <CloseShiftForm
        open={closeShiftVisible}
        onClose={onCancel}
        shift={currentShift} // onSubmit={onCloseShiftSubmit}
        onSubmit={onCloseShiftSubmit}
      />

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
