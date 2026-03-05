import type { ClientEntity } from "@/entities/client";
import {
  ClientFilters,
  ClientForm,
  ClientList,
  useClient,
} from "@/features/client";
import useToast from "@/shared/hooks/use-toast";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { PageHeader } from "@/shared/ui/components/PageHeader";
import { t } from "i18next";
import React, { useState } from "react";

export function ClientManagement() {
  const { showErrorToast, showSuccessToast } = useToast();
  const [selectedItems, setSelectedItems] = useState<ClientEntity[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [sortField, setSortField] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<1 | -1>(1);

  const {
    clients,
    selectedClient,
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
  } = useClient();

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      for (const client of selectedItems) {
        if (client.id) {
          await onDelete(client);
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
    (selected: ClientEntity[]) => {
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
    { value: "id", label: t("client.id") },
    { value: "name", label: t("client.name") },
    { value: "client_type", label: t("client.client_type") },
    { value: "document_code", label: t("client.document_code") },
    { value: "tax_code", label: t("client.tax_code") },
    { value: "login", label: t("client.login") },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex bg-background border rounded-lg py-2 px-4 items-center justify-between">
        <PageHeader
          title="menu.dictionary.clients"
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
      <ClientList
        clients={clients}
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
      <ClientFilters
        open={filtersVisible}
        onClose={onHideFilters}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {formVisible && (
        <ClientForm
          visible={formVisible}
          onHide={onCancel}
          client={selectedClient}
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
