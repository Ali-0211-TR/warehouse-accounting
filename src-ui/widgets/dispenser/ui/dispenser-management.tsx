import type { DispenserEntity } from "@/entities/dispenser";
import {
  DispenserFilters,
  DispenserForm,
  DispenserList,
  useDispenser,
} from "@/features/dispenser";
import { NozzleManagementDialog } from "@/features/dispenser/ui/nozzle-management-dialog";
import useToast from "@/shared/hooks/use-toast";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { PageHeader } from "@/shared/ui/components/PageHeader";
import { Label } from "@/shared/ui/shadcn/label";
import { Switch } from "@/shared/ui/shadcn/switch";
import { t } from "i18next";
import React, { useState } from "react";

export function DispenserManagement() {
  const { showErrorToast, showSuccessToast } = useToast();
  const [selectedItems, setSelectedItems] = useState<DispenserEntity[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [nozzleManagementOpen, setNozzleManagementOpen] = useState(false);
  const [selectedDispenserForNozzles, setSelectedDispenserForNozzles] =
    useState<DispenserEntity | null>(null);
  const [showOrderColumn, setShowOrderColumn] = useState(false);

  const {
    selectedDispenser,
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
    // Add nozzle management functions
    selectedNozzle,
    nozzleFormVisible,
    onAddNozzle,
    onEditNozzle,
    onDeleteNozzle,
    onSaveNozzle,
    onCancelNozzle,
    getDispenserNozzles,
    // Add ordering functions
    getOrderedDispensers,
    moveDispenser,
  } = useDispenser();

  // Get ordered dispensers for display - this is crucial for proper ordering
  const orderedDispensers = getOrderedDispensers();

  // Handle nozzle management
  const handleManageNozzles = (dispenser: DispenserEntity) => {
    setSelectedDispenserForNozzles(dispenser);
    setNozzleManagementOpen(true);
  };

  const handleCloseNozzleManagement = () => {
    setNozzleManagementOpen(false);
    setSelectedDispenserForNozzles(null);
  };

  // Handle reordering
  const handleReorder = (dispenserId: string, newPosition: number) => {
    moveDispenser(dispenserId, newPosition);
    showSuccessToast(t("success.order_updated"));
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      for (const dispenser of selectedItems) {
        if (dispenser.id) {
          await onDelete(dispenser);
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
  const handleSelectionChange = React.useCallback(
    (selected: DispenserEntity[]) => {
      setSelectedItems(selected);
    },
    []
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex bg-background border rounded-lg py-2 px-4 items-center justify-between">
        <PageHeader
          title="menu.dictionary.dispensers"
          hasActiveFilters={hasActiveFilters}
          onShowFilters={onShowFilters}
          onAdd={onAdd}
          clearFilters={clearFilters}
          selectedCount={selectedItems.length}
          onBulkDelete={() => setBulkDeleteOpen(true)}
          addButtonText="control.add_dispenser"
        />

        {/* Order Control Toggle */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="show-order" className="text-sm">
            {t("dispenser.show_order_column")}
          </Label>
          <Switch
            id="show-order"
            checked={showOrderColumn}
            onCheckedChange={checked => {
              setShowOrderColumn(checked);
            }}
          />
        </div>
      </div>

      <DispenserList
        dispensers={orderedDispensers} // Always use ordered dispensers
        loading={loading}
        onEdit={onEdit}
        onDelete={onDelete}
        onManageNozzles={handleManageNozzles}
        onReorder={handleReorder} // ✅ Pass the reorder handler
        selectable={!showOrderColumn} // Disable selection when showing order column
        onSelectionChange={handleSelectionChange}
        showOrderColumn={showOrderColumn} // ✅ Pass the showOrderColumn state
      />

      {/* Filters Dialog */}
      <DispenserFilters
        open={filtersVisible}
        onClose={onHideFilters}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {formVisible && (
        <DispenserForm
          visible={formVisible}
          onHide={onCancel}
          dispenser={selectedDispenser}
          onSave={onSave}
        />
      )}

      {/* Nozzle Management Dialog */}
      <NozzleManagementDialog
        open={nozzleManagementOpen}
        onClose={handleCloseNozzleManagement}
        dispenser={selectedDispenserForNozzles}
        onAddNozzle={onAddNozzle}
        onEditNozzle={onEditNozzle}
        onDeleteNozzle={onDeleteNozzle}
        onSaveNozzle={onSaveNozzle}
        onCancelNozzle={onCancelNozzle}
        selectedNozzle={selectedNozzle}
        nozzleFormVisible={nozzleFormVisible}
        getDispenserNozzles={getDispenserNozzles}
        loading={loading}
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
