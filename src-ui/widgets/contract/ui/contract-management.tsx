import type { ContractEntity } from "@/entities/contract";
import {
  ContractFilters,
  ContractForm,
  ContractList,
  useContract,
} from "@/features/contract";
import useToast from "@/shared/hooks/use-toast";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { PageHeader } from "@/shared/ui/components/PageHeader";
import { t } from "i18next";
import React, { useState } from "react";

export function ContractManagement() {
  const { showErrorToast, showSuccessToast } = useToast();
  const [selectedItems, setSelectedItems] = useState<ContractEntity[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [sortField, setSortField] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<1 | -1>(1);

  const {
    contracts,
    selectedContract,
    formVisible,
    filtersVisible,
    loading,
    hasActiveFilters,
    pagination,
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
    pageChange,
    onSort,
  } = useContract();

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      for (const contract of selectedItems) {
        if (contract.id) {
          await onDelete(contract);
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

  const handleSelectionChange = React.useCallback(
    (selected: ContractEntity[]) => {
      setSelectedItems(selected);
    },
    []
  );

  const handleSortChange = React.useCallback(
    (field: string, order: 1 | -1) => {
      setSortField(field);
      setSortOrder(order);
      onSort(field, order);
    },
    [onSort]
  );

  const sortFields = [
    { value: "id", label: t("contract.id") },
    { value: "name", label: t("contract.name") },
    { value: "client_name", label: t("contract.client") },
    { value: "station_id", label: t("contract.station") },
    { value: "d_begin", label: t("contract.d_begin") },
    { value: "d_end", label: t("contract.d_end") },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex bg-background border rounded-lg py-2 px-4 items-center justify-between">
        <PageHeader
          title="menu.dictionary.contracts"
          hasActiveFilters={hasActiveFilters}
          onShowFilters={onShowFilters}
          onAdd={onAdd}
          clearFilters={clearFilters}
          selectedCount={selectedItems.length}
          onBulkDelete={() => setBulkDeleteOpen(true)}
          showSort={true}
          sortField={sortField}
          sortOrder={sortOrder}
          sortFields={sortFields}
          onSortChange={handleSortChange}
        />
      </div>

      <ContractList
        contracts={contracts}
        loading={loading}
        pagination={pagination}
        onEdit={onEdit}
        onDelete={onDelete}
        onPageChange={pageChange}
        onSort={onSort}
        selectable={true}
        onSelectionChange={handleSelectionChange}
      />
      {/* Filters Dialog */}
      <ContractFilters
        open={filtersVisible}
        onClose={onHideFilters}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {formVisible && (
        <ContractForm
          visible={formVisible}
          onHide={onCancel}
          contract={selectedContract}
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
