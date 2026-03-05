import type { TaxEntity } from "@/entities/tax";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { EntityTable } from "@/shared/ui/components/EntityTable";
import { Badge } from "@/shared/ui/shadcn/badge";
import { format } from "date-fns";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface TaxListProps {
  taxes: TaxEntity[];
  loading: boolean;
  onEdit: (tax: TaxEntity) => void;
  onDelete: (tax: TaxEntity) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: TaxEntity[]) => void;
}

export function TaxList({
  taxes,
  loading,
  onEdit,
  onDelete,
  selectable = false,
  onSelectionChange,
}: TaxListProps) {
  const { t } = useTranslation();
  const [deleteTax, setDeleteTax] = useState<TaxEntity | null>(null);

  const handleDeleteClick = (tax: TaxEntity) => {
    setDeleteTax(tax);
  };

  const handleDeleteConfirm = () => {
    if (deleteTax) {
      onDelete(deleteTax);
      setDeleteTax(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTax(null);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy");
    } catch {
      return dateString;
    }
  };

  const columns = [
    // Hidden ID column (UUID not user-friendly)
    // {
    //   key: "id",
    //   header: t("tax.id"),
    //   accessor: (tax: TaxEntity) => tax.id,
    //   width: "w-16",
    //   align: "center" as const,
    // },
    {
      key: "name",
      header: t("tax.name"),
      accessor: (tax: TaxEntity) => tax.name,
      render: (tax: TaxEntity) => (
        <div className="space-y-1">
          <div className="font-medium">{tax.name}</div>
          <div className="text-sm text-muted-foreground">{tax.short_name}</div>
        </div>
      ),
    },
    {
      key: "short_name",
      header: t("tax.short_name"),
      accessor: (tax: TaxEntity) => tax.short_name,
      width: "w-24",
      render: (tax: TaxEntity) => (
        <Badge variant="outline" className="text-xs font-mono">
          {tax.short_name}
        </Badge>
      ),
    },
    {
      key: "rate",
      header: t("tax.rate"),
      accessor: (tax: TaxEntity) => tax.rate,
      width: "w-24",
      align: "center" as const,
      render: (tax: TaxEntity) => (
        <div className="flex items-center space-x-1">
          <Badge className="text-xs">{tax.rate}%</Badge>
        </div>
      ),
    },
    {
      key: "is_inclusive",
      header: t("tax.is_inclusive"),
      accessor: (tax: TaxEntity) => tax.is_inclusive,
      width: "w-24",
      align: "center" as const,
      render: (tax: TaxEntity) => (
        <div className="flex items-center justify-center">
          {tax.is_inclusive ? (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">{t("tax.inclusive")}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="text-xs">{t("tax.exclusive")}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "d_begin",
      header: t("tax.d_begin"),
      accessor: (tax: TaxEntity) => tax.d_begin,
      width: "w-32",
      render: (tax: TaxEntity) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-mono">{formatDate(tax.d_begin)}</span>
        </div>
      ),
    },
    // {
    //     key: 'status',
    //     header: t('tax.status'),
    //     accessor: (tax: TaxEntity) => new Date(tax.d_begin) <= new Date(),
    //     width: 'w-24',
    //     align: 'center' as const,
    //     render: (tax: TaxEntity) => {
    //         const isActive = new Date(tax.d_begin) <= new Date()
    //         return (
    //             <Badge
    //                 variant={isActive ? 'default' : 'secondary'}
    //                 className="text-xs"
    //             >
    //                 {isActive ? t('tax.status.active') : t('tax.status.pending')}
    //             </Badge>
    //         )
    //     }
    // }
  ];

  return (
    <>
      {/* Desktop / Tablet: show EntityTable on sm and up */}
      <div className="hidden sm:block">
        <EntityTable
          data={taxes}
          columns={columns}
          loading={loading}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
          emptyMessage={"message.no_data"}
          selectable={selectable}
          onSelectionChange={onSelectionChange}
          pageSize={25}
        />
      </div>

      {/* Mobile: show card list on screens smaller than `sm` */}
      <div className="block sm:hidden p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-md shadow-sm bg-muted animate-pulse h-20" />
            ))}
          </div>
        ) : taxes.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">{t("message.no_data")}</div>
        ) : (
          <div className="space-y-3">
            {taxes.map((tax) => (
              <div key={tax.id} className="p-4 border rounded-md shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{tax.name}</div>
                    <div className="text-sm text-muted-foreground">{tax.short_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono">{formatDate(tax.d_begin)}</div>
                    <div className="mt-1">
                      <Badge className="text-xs">{tax.rate}%</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div>
                    {tax.is_inclusive ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs">{t("tax.inclusive")}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs">{t("tax.exclusive")}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => onEdit(tax)}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      {t("control.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(tax)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      {t("control.delete")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteTax}
        title={t("message.confirm_delete")}
        description={
          <>
            {t("message.delete_tax_warning", { name: deleteTax?.name })}
            <br />
            <span className="text-red-600 font-medium">{t("message.action_irreversible")}</span>
          </>
        }
        confirmLabel={t("control.delete")}
        cancelLabel={t("control.cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmClassName="bg-red-600 hover:bg-red-700"
      />
    </>
  );
}
