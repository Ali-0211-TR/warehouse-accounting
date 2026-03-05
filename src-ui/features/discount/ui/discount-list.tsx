import type { DiscountEntity } from "@/entities/discount";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { EntityTable } from "@/shared/ui/components/EntityTable";
import { Badge } from "@/shared/ui/shadcn/badge";
import { useState, useEffect } from "react";
import { Edit, Trash } from "lucide-react"; // lucide icon components for small-screen actions

import { useTranslation } from "react-i18next"; // Use useTranslation hook instead

interface DiscountListProps {
  discounts: DiscountEntity[];
  loading: boolean;
  onEdit: (discount: DiscountEntity) => void;
  onDelete: (discount: DiscountEntity) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: DiscountEntity[]) => void;
}

// Hook to detect small screen (mobile)
function useIsSmallScreen(breakpoint = 640) {
  const [isSmall, setIsSmall] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const listener = (e: MediaQueryListEvent) => setIsSmall(e.matches);
    // addEventListener exists on modern browsers, fallback to addListener
    if (mql.addEventListener) mql.addEventListener("change", listener);
    else mql.addListener(listener as any);
    setIsSmall(mql.matches);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", listener);
      else mql.removeListener(listener as any);
    };
  }, [breakpoint]);

  return isSmall;
}

export function DiscountList({
  discounts,
  loading,
  onEdit,
  onDelete,
  selectable = false,
  onSelectionChange,
}: DiscountListProps) {
  const { t } = useTranslation();
  const [deleteDiscount, setDeleteDiscount] = useState<DiscountEntity | null>(
    null
  );

  const isSmall = useIsSmallScreen(640);

  const handleDeleteClick = (discount: DiscountEntity) => {
    setDeleteDiscount(discount);
  };

  const handleDeleteConfirm = () => {
    if (deleteDiscount) {
      onDelete(deleteDiscount);
      setDeleteDiscount(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDiscount(null);
  };

  const columns = [
    // Hidden ID column (UUID not user-friendly)
    // {
    //     key: 'id',
    //     header: t('discount.id'),
    //     accessor: (discount: DiscountEntity) => discount.id,
    //     width: 'w-16',
    //     align: 'center' as const
    // },
    {
      key: "name",
      header: t("discount.name"),
      accessor: (discount: DiscountEntity) => discount.name,
      render: (discount: DiscountEntity) => discount.name,
    },
    {
      key: "discount_type", // Changed from 'type' to 'discount_type'
      header: t("discount.type"),
      accessor: (discount: DiscountEntity) => discount.discount_type,
      width: "w-32",
      render: (discount: DiscountEntity) => (
        <Badge variant="secondary" className="text-xs">
          {t(`lists.discount_type.${discount.discount_type}`)}
        </Badge>
      ),
    },
    {
      key: "discount_value", // Changed from 'value' to 'discount_value'
      header: t("discount.value"),
      accessor: (discount: DiscountEntity) => discount.value,
      width: "w-24",
      align: "left" as const,
      render: (discount: DiscountEntity) => (
        <span className="font-mono">
          {/* {discount.discount_type === 'Percent' ? `${discount.value}%` : discount.value} */}
          {discount.value}
        </span>
      ),
    },
    {
      key: "bound_value", // Changed from 'bound' to 'bound_value'
      header: t("discount.bound"),
      accessor: (discount: DiscountEntity) => discount.bound,
      width: "w-24",
      align: "left" as const,
    },
    {
      key: "bound_type",
      header: t("discount.bound_type"),
      accessor: (discount: DiscountEntity) => discount.discount_bound_type,
      width: "w-32",
      align: "left" as const,
      render: (discount: DiscountEntity) => (
        <Badge variant="outline" className="text-xs">
          {t(`lists.bound_type.${discount.discount_bound_type}`)}
        </Badge>
      ),
    },
    {
      key: "product_type",
      header: t("discount.product_type"),
      accessor: (discount: DiscountEntity) => discount.product_type,
      width: "w-32",
      render: (discount: DiscountEntity) =>
        discount.product_type ? (
          <Badge variant="default" className="text-xs">
            {t(`lists.product_type.${discount.product_type}`)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("common.all")}
          </span>
        ),
    },
  ];

  // Small screen: render as cards
  if (isSmall) {
    return (
      <>
        <div className="space-y-3 p-4">
          {discounts.map((discount) => (
            <div
              key={discount.id}
              className="border rounded-lg p-4 bg-background shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium">{discount.name}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {t(`lists.discount_type.${discount.discount_type}`)}
                    </Badge>
                    <span className="font-mono text-sm">
                      {discount.value}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {t(`lists.bound_type.${discount.discount_bound_type}`)}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {discount.product_type
                      ? t(`lists.product_type.${discount.product_type}`)
                      : t("common.all")}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    type="button"
                    aria-label={t("control.edit")}
                    title={t("control.edit")}
                    onClick={() => onEdit(discount)}
                    className="p-2 rounded-md hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                    <span className="sr-only">{t("control.edit")}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("control.delete")}
                    title={t("control.delete")}
                    onClick={() => handleDeleteClick(discount)}
                    className="p-2 rounded-md hover:bg-gray-100"
                  >
                    <Trash className="w-4 h-4 text-red-600" />
                    <span className="sr-only">{t("control.delete")}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <ConfirmationDialog
          open={!!deleteDiscount}
          title={t("message.confirm_delete")}
          description={
            <>
              {t("message.delete_discount_warning", {
                name: deleteDiscount?.name,
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
      </>
    );
  }

  // Default: table view
  return (
    <>
      <EntityTable
        data={discounts}
        columns={columns}
        loading={loading}
        onEdit={onEdit}
        onDelete={handleDeleteClick}
        emptyMessage={"message.no_data"}
        selectable={selectable}
        onSelectionChange={onSelectionChange}
        pageSize={25}
      />

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteDiscount}
        title={t("message.confirm_delete")}
        description={
          <>
            {t("message.delete_discount_warning", {
              name: deleteDiscount?.name,
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
    </>
  );
}
