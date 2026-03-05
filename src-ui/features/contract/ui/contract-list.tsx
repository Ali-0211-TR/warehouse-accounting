import type { ContractEntity } from "@/entities/contract";
import { PaginationInfo } from "@/shared/const/realworld.types";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import {
  ServerEntityCards,
  type CardAction,
} from "@/shared/ui/components/ServerEntityCards";
import { ServerEntityTable } from "@/shared/ui/components/ServerEntityTable";
import { Badge } from "@/shared/ui/shadcn/badge";
import { DropdownMenuItem } from "@/shared/ui/shadcn/dropdown-menu";
import { t } from "i18next";
import { Calendar, CalendarDays, Eye, FileText, User } from "lucide-react";
import { useState } from "react";
import { ContractDetailsDialog } from "./contract-details-dialog";

interface ContractListProps {
  contracts: ContractEntity[];
  loading: boolean;
  pagination: PaginationInfo;
  onEdit: (contract: ContractEntity) => void;
  onDelete: (contract: ContractEntity) => void;
  onPageChange: (page: number) => void;
  onSort: (field: string, order: 1 | -1) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: ContractEntity[]) => void;
}

export function ContractList({
  contracts,
  loading,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
  onSort,
  selectable = false,
  onSelectionChange,
}: ContractListProps) {
  const [deleteContract, setDeleteContract] = useState<ContractEntity | null>(
    null
  );
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    null
  );

  const handleDeleteClick = (contract: ContractEntity) => {
    setDeleteContract(contract);
  };

  const handleDeleteConfirm = () => {
    if (deleteContract) {
      onDelete(deleteContract);
      setDeleteContract(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteContract(null);
  };

  const handleViewDetails = (contract: ContractEntity) => {
    setSelectedContractId(contract.id);
    setDetailsDialogOpen(true);
  };

  const getContractStatus = (contract: ContractEntity) => {
    if (!contract.d_begin || !contract.d_end) {
      return { status: "unknown", color: "gray" };
    }

    const today = new Date().toISOString().split("T")[0];
    const startDate = contract.d_begin.split("T")[0];
    const endDate = contract.d_end.split("T")[0];

    if (today < startDate) return { status: "pending", color: "yellow" };
    if (today > endDate) return { status: "expired", color: "red" };
    return { status: "active", color: "green" };
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return t("common.not_set");
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return t("common.invalid_date");
    }
  };

  // Render function for contract card
  const renderContractCard = (contract: ContractEntity) => {
    const { status } = getContractStatus(contract);
    const variants: Record<string, string> = {
      active: "bg-green-50 text-green-700 border-green-200",
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      expired: "bg-red-50 text-red-700 border-red-200",
      unknown: "bg-gray-50 text-gray-700 border-gray-200",
    };

    return (
      <>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold truncate">{contract.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {contract.contract_name}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={`text-xs whitespace-nowrap ${
              variants[status] || variants.unknown
            }`}
          >
            {t(`contract.status_${status}`) || status}
          </Badge>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs truncate">
              {contract.client?.name || t("common.not_assigned")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs truncate">
              {formatDate(contract.d_begin)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs truncate">
              {formatDate(contract.d_end)}
            </span>
          </div>
        </div>
      </>
    );
  };

  // Custom actions for contract cards
  const getContractCardActions = (): CardAction<ContractEntity>[] => [
    {
      label: t("control.view_details"),
      icon: <Eye className="h-4 w-4 mr-2" />,
      onClick: contract => handleViewDetails(contract),
    },
  ];

  const columns = [
    // Hidden ID column (UUID not user-friendly)
    // {
    //   key: "id",
    //   header: t("contract.id"),
    //   accessor: (contract: ContractEntity) => contract.id,
    //   width: "w-16",
    //   align: "center" as const,
    //   sortable: true,
    // },
    {
      key: "name",
      header: t("contract.name"),
      accessor: (contract: ContractEntity) => contract.name,
      sortable: true,
      render: (contract: ContractEntity) => (
        <div className="flex items-center space-x-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div className="space-y-1">
            <div className="font-medium">{contract.name}</div>
            <div className="text-sm text-muted-foreground">
              {contract.contract_name}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "client_name",
      header: t("contract.client"),
      accessor: (contract: ContractEntity) => contract.client?.name || "",
      sortable: true,
      render: (contract: ContractEntity) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {contract.client?.name || t("common.not_assigned")}
          </span>
        </div>
      ),
    },
    {
      key: "d_begin",
      header: t("contract.d_begin"),
      accessor: (contract: ContractEntity) => contract.d_begin,
      width: "w-32",
      sortable: true,
      render: (contract: ContractEntity) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatDate(contract.d_begin)}</span>
        </div>
      ),
    },
    {
      key: "d_end",
      header: t("contract.d_end"),
      accessor: (contract: ContractEntity) => contract.d_end,
      width: "w-32",
      sortable: true,
      render: (contract: ContractEntity) => (
        <div className="flex items-center space-x-1">
          <CalendarDays className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatDate(contract.d_end)}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: t("contract.status"),
      accessor: (contract: ContractEntity) =>
        getContractStatus(contract).status,
      width: "w-24",
      render: (contract: ContractEntity) => {
        const { status } = getContractStatus(contract);
        const variants: Record<string, string> = {
          active: "bg-green-50 text-green-700 border-green-200",
          pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
          expired: "bg-red-50 text-red-700 border-red-200",
          unknown: "bg-gray-50 text-gray-700 border-gray-200",
        };
        return (
          <Badge
            variant="secondary"
            className={`text-xs ${variants[status] || variants.unknown}`}
          >
            {t(`contract.status_${status}`) || status}
          </Badge>
        );
      },
    },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* Card View for Small/Medium Screens */}
        <div className="lg:hidden p-4">
          <ServerEntityCards
            data={contracts}
            loading={loading}
            pagination={pagination}
            onEdit={onEdit}
            onDelete={handleDeleteClick}
            onPageChange={onPageChange}
            renderCard={renderContractCard}
            customActions={getContractCardActions}
          />
        </div>

        {/* Table View for Large Screens */}
        <div className="hidden lg:block">
          <ServerEntityTable
            data={contracts}
            columns={columns}
            loading={loading}
            onEdit={onEdit}
            onDelete={handleDeleteClick}
            onSort={onSort}
            emptyMessage={"message.no_data"}
            selectable={selectable}
            onSelectionChange={onSelectionChange}
            actions={contract => (
              <DropdownMenuItem onClick={() => handleViewDetails(contract)}>
                <Eye className="h-4 w-4 mr-2" />
                {t("control.view_details")}
              </DropdownMenuItem>
            )}
            // Pagination props
            pageIndex={pagination.page - 1} // Convert 1-based to 0-based
            pageCount={pagination.pageCount}
            canPreviousPage={pagination.page > 1}
            canNextPage={pagination.page < pagination.pageCount}
            onPreviousPage={() => onPageChange(pagination.page - 1)}
            onGoToPage={(pageIndex0) => onPageChange(pageIndex0 + 1)}
            onNextPage={() => onPageChange(pagination.page + 1)}
            totalCount={pagination.count}
          />
        </div>
      </div>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteContract}
        title={t("message.confirm_delete")}
        description={
          <>
            {t("message.delete_contract_warning", {
              name: deleteContract?.name,
            })}
            <br />
            <span className="text-red-600 font-medium">
              {t("message.action_irreversible")}
            </span>
          </>
        }
        confirmLabel={t("control.delete")}
        cancelLabel={t("control.cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmClassName="bg-red-600 hover:bg-red-700"
      />

      {/* Contract Details Dialog */}
      <ContractDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        contractId={selectedContractId}
      />
    </>
  );
}
