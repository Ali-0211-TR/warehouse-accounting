import type { ClientEntity } from "@/entities/client";
import { PaginationInfo } from "@/shared/const/realworld.types";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import {
  ServerEntityCards,
  type CardAction,
} from "@/shared/ui/components/ServerEntityCards";
import { ServerEntityTable } from "@/shared/ui/components/ServerEntityTable";
import { Badge } from "@/shared/ui/shadcn/badge";
import { t } from "i18next";
import {
  Building,
  CreditCard,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { useState } from "react";

interface ClientListProps {
  clients: ClientEntity[];
  loading: boolean;
  pagination: PaginationInfo;
  onEdit: (client: ClientEntity) => void;
  onDelete: (client: ClientEntity) => void;
  onPageChange: (page: number) => void;
  onSort: (field: string, order: 1 | -1) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: ClientEntity[]) => void;
}

export function ClientList({
  clients,
  loading,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
  onSort,
  selectable = false,
  onSelectionChange,
}: ClientListProps) {
  const [deleteClient, setDeleteClient] = useState<ClientEntity | null>(null);

  const handleDeleteClick = (client: ClientEntity) => {
    setDeleteClient(client);
  };

  const handleDeleteConfirm = () => {
    if (deleteClient) {
      onDelete(deleteClient);
      setDeleteClient(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteClient(null);
  };

  const getClientTypeColor = (clientType: string) => {
    switch (clientType) {
      case "INDIVIDUAL":
        return "blue";
      case "LEGAL_ENTITY":
        return "green";
      case "ENTREPRENEUR":
        return "purple";
      default:
        return "gray";
    }
  };

  // Render function for client card
  const renderClientCard = (client: ClientEntity) => (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3 ">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <h3 className="font-semibold truncate">{client.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {client.name_short}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs whitespace-nowrap">
          {t(`lists.client_type.${client.client_type}`)}
        </Badge>
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {client.document_code && (
          <div className="flex items-center gap-1.5 min-w-0">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="font-mono text-xs truncate">
              {client.document_code}
            </span>
          </div>
        )}
        {client.tax_code && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Building className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="font-mono text-xs truncate">
              {client.tax_code}
            </span>
          </div>
        )}
        {client.contact && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs truncate">{client.contact}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <Badge variant="outline" className="text-xs font-mono truncate">
            {client.login}
          </Badge>
        </div>
      </div>

      {/* Address */}
      {client.address && (
        <div className="flex items-start gap-1.5 mt-2 pt-2 border-t">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <span className="text-xs text-muted-foreground line-clamp-1">
            {client.address}
          </span>
        </div>
      )}
    </>
  );

  // Custom actions for client cards
  const getClientCardActions = (): CardAction<ClientEntity>[] => [];

  const columns = [
    // Hidden ID column (UUID not user-friendly)
    // {
    //   key: "id",
    //   header: t("client.id"),
    //   accessor: (client: ClientEntity) => client.id,
    //   width: "w-16",
    //   align: "center" as const,
    //   sortable: true,
    // },
    {
      key: "name",
      header: t("client.name"),
      accessor: (client: ClientEntity) => client.name,
      sortable: true,
      render: (client: ClientEntity) => (
        <div className="flex items-center space-x-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="space-y-1">
            <div className="font-medium">{client.name}</div>
            <div className="text-sm text-muted-foreground">
              {client.name_short}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "client_type",
      header: t("client.client_type"),
      accessor: (client: ClientEntity) => client.client_type,
      width: "w-32",
      sortable: true,
      render: (client: ClientEntity) => {
        const color = getClientTypeColor(client.client_type);
        return (
          <Badge
            variant="secondary"
            className={`text-xs bg-${color}-50 text-${color}-700 border-${color}-200`}
          >
            {t(`lists.client_type.${client.client_type}`)}
          </Badge>
        );
      },
    },
    {
      key: "document_code",
      header: t("client.document_code"),
      accessor: (client: ClientEntity) => client.document_code || "",
      width: "w-32",
      sortable: true,
      render: (client: ClientEntity) => (
        <div className="flex items-center space-x-1">
          <CreditCard className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-sm">
            {client.document_code || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "tax_code",
      header: t("client.tax_code"),
      accessor: (client: ClientEntity) => client.tax_code || "",
      width: "w-32",
      sortable: true,
      render: (client: ClientEntity) => (
        <div className="flex items-center space-x-1">
          <Building className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-sm">{client.tax_code || "—"}</span>
        </div>
      ),
    },
    {
      key: "contact",
      header: t("client.contact"),
      accessor: (client: ClientEntity) => client.contact || "",
      width: "w-32",
      render: (client: ClientEntity) => (
        <div className="flex items-center space-x-1">
          <Phone className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{client.contact || "—"}</span>
        </div>
      ),
    },
    {
      key: "address",
      header: t("client.address"),
      accessor: (client: ClientEntity) => client.address || "",
      render: (client: ClientEntity) => (
        <div className="flex items-center space-x-1 max-w-48">
          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-sm truncate" title={client.address || ""}>
            {client.address || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "login",
      header: t("client.login"),
      accessor: (client: ClientEntity) => client.login,
      width: "w-32",
      sortable: true,
      render: (client: ClientEntity) => (
        <Badge variant="outline" className="text-xs font-mono">
          {client.login}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <div className="space-y-4">
        {/* Card View for Small/Medium Screens */}
        <div className="lg:hidden">
          <ServerEntityCards
            data={clients}
            loading={loading}
            pagination={pagination}
            onEdit={onEdit}
            onDelete={handleDeleteClick}
            onPageChange={onPageChange}
            renderCard={renderClientCard}
            customActions={getClientCardActions}
          />
        </div>

        {/* Table View for Large Screens */}
        <div className="hidden lg:block">
          <ServerEntityTable
            data={clients}
            columns={columns}
            loading={loading}
            onEdit={onEdit}
            onDelete={handleDeleteClick}
            onSort={onSort}
            emptyMessage={"message.no_data"}
            selectable={selectable}
            onSelectionChange={onSelectionChange}
            actions={_client => (
              <></>
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
        open={!!deleteClient}
        title={t("message.confirm_delete")}
        description={
          <>
            {t("message.delete_client_warning", { name: deleteClient?.name })}
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
    </div>
  );
}
