import type { ContractEntity, ContractFilterState } from "./types";

export const contractSelectors = {
  // Helper function to get contract status
  getContractStatus: (
    contract: ContractEntity
  ): "upcoming" | "active" | "expired" => {
    const today = new Date().toISOString().split("T")[0];

    if (!contract.d_begin || !contract.d_end) return "active"; // Default for incomplete data

    const beginDate = contract.d_begin.split("T")[0];
    const endDate = contract.d_end.split("T")[0];

    if (beginDate > today) return "upcoming";
    if (endDate < today) return "expired";
    return "active";
  },

  filterContracts: (
    contracts: ContractEntity[],
    filters: ContractFilterState
  ): ContractEntity[] => {
    return contracts.filter(contract => {
      const matchesSearch =
        !filters.search ||
        contract.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        contract.contract_name
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        (contract.client?.name &&
          contract.client.name
            .toLowerCase()
            .includes(filters.search.toLowerCase()));

      const matchesClient =
        !filters.client_id || contract.client?.id === filters.client_id;

      const matchesDateRange =
        !filters.date_range ||
        (() => {
          const startFilter = filters.date_range.start;
          const endFilter = filters.date_range.end;

          if (!startFilter && !endFilter) return true;

          const contractBegin = contract.d_begin
            ? contract.d_begin.split("T")[0]
            : null;
          const contractEnd = contract.d_end
            ? contract.d_end.split("T")[0]
            : null;

          if (startFilter && contractEnd && contractEnd < startFilter)
            return false;
          if (endFilter && contractBegin && contractBegin > endFilter)
            return false;

          return true;
        })();

      return matchesSearch && matchesClient && matchesDateRange;
    });
  },

  sortContracts: (
    contracts: ContractEntity[],
    sortBy: keyof ContractEntity = "name",
    sortOrder: "asc" | "desc" = "asc"
  ): ContractEntity[] => {
    return [...contracts].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortOrder === "asc" ? 1 : -1;
      if (bVal == null) return sortOrder === "asc" ? -1 : 1;

      let comparison = 0;

      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        // Convert to string for comparison
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });
  },

  getContractsByClient: (
    contracts: ContractEntity[],
    clientId: string
  ): ContractEntity[] => {
    return contracts.filter(contract => contract.client?.id === clientId);
  },

  getActiveContracts: (contracts: ContractEntity[]): ContractEntity[] => {
    const today = new Date().toISOString().split("T")[0];
    return contracts.filter(contract => {
      if (!contract.d_begin || !contract.d_end) return false;

      const beginDate = contract.d_begin.split("T")[0];
      const endDate = contract.d_end.split("T")[0];

      return beginDate <= today && endDate >= today;
    });
  },

  getExpiredContracts: (contracts: ContractEntity[]): ContractEntity[] => {
    const today = new Date().toISOString().split("T")[0];
    return contracts.filter(contract => {
      if (!contract.d_end) return false;

      const endDate = contract.d_end.split("T")[0];
      return endDate < today;
    });
  },

  getUpcomingContracts: (contracts: ContractEntity[]): ContractEntity[] => {
    const today = new Date().toISOString().split("T")[0];
    return contracts.filter(contract => {
      if (!contract.d_begin) return false;

      const beginDate = contract.d_begin.split("T")[0];
      return beginDate > today;
    });
  },

  getContractsByStatus: (
    contracts: ContractEntity[],
    status: "upcoming" | "active" | "expired"
  ): ContractEntity[] => {
    return contracts.filter(
      contract => contractSelectors.getContractStatus(contract) === status
    );
  },

  getContractsEndingSoon: (
    contracts: ContractEntity[],
    daysAhead: number = 30
  ): ContractEntity[] => {
    const today = new Date();
    const futureDate = new Date(
      today.getTime() + daysAhead * 24 * 60 * 60 * 1000
    );
    const futureDateStr = futureDate.toISOString().split("T")[0];

    return contracts.filter(contract => {
      if (!contract.d_end) return false;

      const endDate = contract.d_end.split("T")[0];
      const todayStr = today.toISOString().split("T")[0];

      return endDate >= todayStr && endDate <= futureDateStr;
    });
  },
};
