import { useState, useCallback, useEffect } from "react";
import { useClientStore } from "@/entities/client";
import type { ClientEntity, ClientFilterState } from "@/entities/client";
import { useToast } from "@/shared/hooks/use-toast";
import { ClientDTO } from "@/shared/bindings/ClientDTO";
import { SortOrder } from "@/shared/bindings/SortOrder";
import { useTranslation } from "react-i18next";
import { emptyClient } from "@/entities/client/model/schemas";
import { ClientSortField } from "@/entities/client/model/types";

export function useClient() {
  const [selectedClient, setSelectedClient] = useState<ClientEntity | null>(
    null,
  );
  const [formVisible, setFormVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { t } = useTranslation();

  const {
    clients,
    pagination,
    loading,
    query,
    loadClients,
    saveClient,
    deleteClient,
    pageChange,
    reset,
  } = useClientStore();

  const { showErrorToast, showSuccessToast } = useToast();

  // Load initial data
  useEffect(() => {
    loadClients().catch(showErrorToast);

    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [loadClients, showErrorToast, reset]);

  const onAdd = useCallback(() => {
    setSelectedClient(emptyClient);
    setFormVisible(true);
  }, []);

  const onEdit = useCallback((client: ClientEntity) => {
    setSelectedClient(client);
    setFormVisible(true);
  }, []);

  const onDelete = useCallback(
    async (client: ClientEntity) => {
      if (!client.id) return;

      try {
        await deleteClient(client.id);
        showSuccessToast(t("success.data_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteClient, showErrorToast, showSuccessToast, t],
  );

  const onSave = useCallback(
    async (clientDTO: ClientDTO) => {
      try {
        await saveClient(clientDTO);
        showSuccessToast(
          clientDTO.id ? t("success.data_updated") : t("success.data_created"),
        );
        setFormVisible(false);
        setSelectedClient(null);
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [saveClient, showErrorToast, showSuccessToast, t],
  );

  const onCancel = useCallback(() => {
    setFormVisible(false);
    setSelectedClient(null);
  }, []);

  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
  }, []);

  const setFilters = useCallback(
    (filters: ClientFilterState) => {
      loadClients({ filters });
    },
    [loadClients],
  );

  const clearFilters = useCallback(() => {
    const emptyFilters: ClientFilterState = {
      search: "",
      client_type: undefined,
      has_tax_code: undefined,
    };
    loadClients({ filters: emptyFilters });
  }, [loadClients]);

  const hasActiveFilters = query.filters
    ? query.filters.search !== "" ||
      query.filters.client_type !== undefined ||
      query.filters.has_tax_code !== undefined
    : false;

  // Map frontend sort field names to backend ClientColumn enum values
  const mapSortFieldToBackend = (field: string): ClientSortField => {
    const fieldMapping: Record<string, ClientSortField> = {
      id: "Id",
      name: "Name",
      name_short: "NameShort",
      client_type: "ClientType",
      document_code: "DocumentCode",
      tax_code: "TaxCode",
      contact: "Contact",
      login: "Login",
      address: "Address",
      bank: "Bank",
    };
    return fieldMapping[field] || "Name";
  };

  // Convert frontend sort order (1 | -1) to backend SortOrder enum
  const onSort = useCallback((field: string, order: 1 | -1) => {
    const sortOrder: SortOrder = order === 1 ? "Asc" : "Desc";
    const backendField = mapSortFieldToBackend(field);
    loadClients({ sortField: backendField, sortOrder });
  }, []);

  return {
    clients,
    pageChange,
    selectedClient,
    loading,
    formVisible,
    filtersVisible,
    filters: query.filters || {
      search: "",
      client_type: undefined,
      has_tax_code: undefined,
    },
    hasActiveFilters,
    pagination,
    onAdd,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    onShowFilters,
    onHideFilters,
    setFilters,
    clearFilters,
    onSort,
    reload: loadClients,
  };
}
