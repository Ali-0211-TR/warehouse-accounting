import type { ContractEntity, ContractFilterState } from "@/entities/contract";
import { useContractStore } from "@/entities/contract";
import { emptyContract } from "@/entities/contract/model/schemas";
import { ContractSortField } from "@/entities/contract/model/types";
import { ContractDTO } from "@/shared/bindings/ContractDTO";
import { SortOrder } from "@/shared/bindings/SortOrder";
import { useToast } from "@/shared/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function useContract() {
  const [selectedContract, setSelectedContract] =
    useState<ContractEntity | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { t } = useTranslation();

  const {
    contracts,
    pagination,
    loading,
    query,
    loadContracts,
    saveContract,
    deleteContract,
    pageChange,
    reset,
  } = useContractStore();

  const { showErrorToast, showSuccessToast } = useToast();

  // Load initial data
  useEffect(() => {
    loadContracts().catch(showErrorToast);
    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [loadContracts, showErrorToast, reset]);

  const onAdd = useCallback(() => {
    setSelectedContract(emptyContract);
    setFormVisible(true);
  }, []);

  const onEdit = useCallback((contract: ContractEntity) => {
    setSelectedContract(contract);
    setFormVisible(true);
  }, []);

  const onDelete = useCallback(
    async (contract: ContractEntity) => {
      if (!contract.id) return;

      try {
        await deleteContract(contract.id);
        showSuccessToast(t("success.data_deleted"));
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [deleteContract, showErrorToast, showSuccessToast, t]
  );

  const onSave = useCallback(
    async (contractDTO: ContractDTO) => {
      try {
        await saveContract(contractDTO);
        showSuccessToast(
          contractDTO.id ? t("success.data_updated") : t("success.data_created")
        );
        setFormVisible(false);
        setSelectedContract(null);
      } catch (error: any) {
        showErrorToast(error.message);
      }
    },
    [saveContract, showErrorToast, showSuccessToast, t]
  );

  const onCancel = useCallback(() => {
    setFormVisible(false);
    setSelectedContract(null);
  }, []);

  const onShowFilters = useCallback(() => {
    setFiltersVisible(true);
  }, []);

  const onHideFilters = useCallback(() => {
    setFiltersVisible(false);
  }, []);

  const setFilters = useCallback(
    (filters: ContractFilterState) => {
      loadContracts({ filters });
    },
    [loadContracts]
  );

  const clearFilters = useCallback(() => {
    const emptyFilters: ContractFilterState = {
      search: "",
      client_id: undefined,
      date_range: undefined,
    };
    loadContracts({ filters: emptyFilters });
    setFormVisible(false);
    setSelectedContract(null);
  }, [loadContracts]);

  const hasActiveFilters = query.filters
    ? query.filters.search !== "" ||
      query.filters.client_id !== undefined ||
      query.filters.date_range !== undefined
    : false;

  // Map frontend sort field names to backend ContractColumn enum values
  const mapSortFieldToBackend = (field: string): ContractSortField => {
    const fieldMapping: Record<string, ContractSortField> = {
      id: "Id",
      name: "Name",
      contract_name: "ContractName",
      d_begin: "DBegin",
      d_end: "DEnd",
      client_name: "Name",
      station_name: "Name",
    };
    return fieldMapping[field] || "Name";
  };

  // Convert frontend sort order (1 | -1) to backend SortOrder enum
  const onSort = useCallback((field: string, order: 1 | -1) => {
    const sortOrder: SortOrder = order === 1 ? "Asc" : "Desc";
    const backendField = mapSortFieldToBackend(field);
    loadContracts({ sortField: backendField, sortOrder });
  }, []);

  return {
    contracts,
    pagination,
    selectedContract,
    loading,
    formVisible,
    filtersVisible,
    filters: query.filters || {
      search: "",
      client_id: undefined,
      date_range: undefined,
    },
    hasActiveFilters,
    onAdd,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    onShowFilters,
    onHideFilters,
    setFilters,
    clearFilters,
    pageChange,
    onSort,
    reload: reset,
  };
}
