import {
  type ProductEntity,
  getIncomePrice,
  getOutcomePrice,
  getSalePrice,
} from "@/entities/product";
import type { PriceEntity } from "@/shared/bindings/PriceEntity";
import { EntityTable } from "@/shared/ui/components/EntityTable";
import { ServerEntityTable } from "@/shared/ui/components/ServerEntityTable";
import type { PaginationInfo } from "@/shared/const/realworld.types";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Barcode, Hash, Package } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PriceListReport } from "./price-list-report";

interface ProductReportListProps {
  products: ProductEntity[];
  loading: boolean;
  onEdit?: (product: ProductEntity) => void;
  onDelete?: (product: ProductEntity) => void;
  onSavePrices?: (productId: number, prices: PriceEntity[]) => Promise<void>;
  selectable?: boolean;
  onSelectionChange?: (selected: ProductEntity[]) => void;
  // Server-side pagination props
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onSort?: (field: string, order: 1 | -1) => void;
}

export function ProductReportList({
  products,
  loading,
  onEdit,
  selectable = false,
  onSelectionChange,
  pagination,
  onPageChange,
  onSort,
}: ProductReportListProps) {
  const { t } = useTranslation();

  // State for price list report dialog
  const [priceEditorVisible, setPriceEditorVisible] = useState(false);
  const [selectedProductForPrices, setSelectedProductForPrices] =
    useState<ProductEntity | null>(null);

  const handleHidePriceEditor = () => {
    setPriceEditorVisible(false);
    setSelectedProductForPrices(null);
  };

  const getProductTypeColor = (productType: string) => {
    switch (productType) {
      case "FUEL":
        return "blue";
      case "GOODS":
        return "green";
      case "SERVICE":
        return "purple";
      default:
        return "gray";
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance <= 0) return "destructive";
    if (balance < 10) return "warning";
    return "default";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatBalance = (
    balance: number,
    unit?: { short_name: string } | null
  ) => {
    return `${balance} ${unit?.short_name || ""}`;
  };

  const columns = [
    {
      key: "name",
      header: t("product.name"),
      accessor: (product: ProductEntity) => product.name,
      render: (product: ProductEntity) => (
        <div className="flex items-center space-x-3">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div className="space-y-1">
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-muted-foreground">
              {product.short_name}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "article",
      header: t("product.article"),
      accessor: (product: ProductEntity) => product.article,
      width: "w-32",
      render: (product: ProductEntity) => (
        <div className="flex items-center space-x-1">
          <Hash className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-sm">{product.article}</span>
        </div>
      ),
    },
    {
      key: "product_type",
      header: t("product.product_type"),
      accessor: (product: ProductEntity) => product.product_type,
      width: "w-32",
      render: (product: ProductEntity) => {
        const color = getProductTypeColor(product.product_type);
        return (
          <Badge
            variant="secondary"
            className={`text-xs bg-${color}-50 text-${color}-700 border-${color}-200`}
          >
            {t(`lists.product_type.${product.product_type}`)}
          </Badge>
        );
      },
    },
    {
      key: "balance",
      header: t("product.balance"),
      accessor: (product: ProductEntity) => product.balance,
      width: "w-24",
      align: "right" as const,
      render: (product: ProductEntity) => (
        <div className="text-right">
          <Badge
            variant={getBalanceColor(product.balance) as any}
            className="text-xs"
          >
            {formatBalance(product.balance, product.unit)}
          </Badge>
        </div>
      ),
    },
    {
      key: "prices",
      header: t("product.price_list"),
      accessor: (product: ProductEntity) => {
        return getSalePrice(product); // For sorting purposes
      },
      width: "w-48",
      align: "left" as const,
      render: (product: ProductEntity) => {
        return (
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {t("product.sale")}:
              </span>
              <span className="font-mono font-medium text-green-700">
                {formatPrice(getSalePrice(product))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {t("product.income")}:
              </span>
              <span className="font-mono text-blue-700">
                {formatPrice(getIncomePrice(product))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {t("product.outcome")}:
              </span>
              <span className="font-mono text-orange-700">
                {formatPrice(getOutcomePrice(product))}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "unit",
      header: t("product.unit"),
      accessor: (product: ProductEntity) => product.unit?.short_name || "",
      width: "w-24",
      align: "center" as const,
      render: (product: ProductEntity) => (
        <Badge variant="outline" className="text-xs font-mono">
          {product.unit?.short_name || "—"}
        </Badge>
      ),
    },
    {
      key: "bar_code",
      header: t("product.bar_code"),
      accessor: (product: ProductEntity) => product.bar_code,
      width: "w-32",
      render: (product: ProductEntity) => (
        <div className="flex items-center space-x-1">
          <Barcode className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-xs">{product.bar_code}</span>
        </div>
      ),
    },
    {
      key: "group",
      header: t("product.group"),
      accessor: (product: ProductEntity) => product.group?.name || "",
      width: "w-32",
      render: (product: ProductEntity) => (
        <Badge variant="outline" className="text-xs">
          {product.group?.name || "—"}
        </Badge>
      ),
    },
  ];

  const renderMobileCards = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-3 bg-background animate-pulse"
            >
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="mt-2 h-3 w-2/3 bg-muted rounded" />
              <div className="mt-3 h-3 w-1/3 bg-muted rounded" />
            </div>
          ))}
        </div>
      );
    }

    if (!products?.length) {
      return (
        <div className="border rounded-lg p-4 text-sm text-muted-foreground">
          {t("message.no_data")}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {products.map((product) => {
          const typeColor = getProductTypeColor(product.product_type);

          return (
            <div
              key={product.id}
              className="border rounded-lg p-3 bg-background"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div className="font-medium truncate">{product.name}</div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {product.short_name}
                  </div>
                </div>

                <Badge
                  variant={getBalanceColor(product.balance) as any}
                  className="text-xs shrink-0"
                >
                  {formatBalance(product.balance, product.unit)}
                </Badge>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-[10px] bg-${typeColor}-50 text-${typeColor}-700 border-${typeColor}-200`}
                >
                  {t(`lists.product_type.${product.product_type}`)}
                </Badge>

                <Badge variant="outline" className="text-[10px] font-mono">
                  {product.unit?.short_name || "—"}
                </Badge>

                {product.article ? (
                  <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                    <Hash className="h-3 w-3" />
                    <span className="truncate max-w-[10rem]">
                      {product.article}
                    </span>
                  </div>
                ) : null}

                {product.bar_code ? (
                  <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                    <Barcode className="h-3 w-3" />
                    <span className="truncate max-w-[10rem]">
                      {product.bar_code}
                    </span>
                  </div>
                ) : null}

                {product.group?.name ? (
                  <Badge variant="outline" className="text-[10px]">
                    {product.group?.name}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-md border p-2">
                  <div className="text-[10px] text-muted-foreground">
                    {t("product.sale")}
                  </div>
                  <div className="font-mono font-medium text-green-700 truncate">
                    {formatPrice(getSalePrice(product))}
                  </div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="text-[10px] text-muted-foreground">
                    {t("product.income")}
                  </div>
                  <div className="font-mono text-blue-700 truncate">
                    {formatPrice(getIncomePrice(product))}
                  </div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="text-[10px] text-muted-foreground">
                    {t("product.outcome")}
                  </div>
                  <div className="font-mono text-orange-700 truncate">
                    {formatPrice(getOutcomePrice(product))}
                  </div>
                </div>
              </div>

              {onEdit ? (
                <div className="mt-3">
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => onEdit(product)}
                  >
                    {t("actions.edit")}
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="md:hidden">{renderMobileCards()}</div>

      <div className="hidden md:block">
        {pagination && onPageChange ? (
          <ServerEntityTable
            data={products}
            columns={columns}
            loading={loading}
            onEdit={onEdit}
            onSort={onSort}
            emptyMessage={"message.no_data"}
            selectable={selectable}
            onSelectionChange={onSelectionChange}
            pageIndex={pagination.page - 1}
            pageCount={pagination.pageCount}
            canPreviousPage={pagination.page > 1}
            canNextPage={pagination.page < pagination.pageCount}
            onPreviousPage={() => onPageChange(pagination.page - 1)}
            onGoToPage={(pageIndex0) => onPageChange(pageIndex0 + 1)}
            onNextPage={() => onPageChange(pagination.page + 1)}
            totalCount={pagination.count}
          />
        ) : (
          <EntityTable
            data={products}
            columns={columns}
            loading={loading}
            onEdit={onEdit}
            emptyMessage={"message.no_data"}
            selectable={selectable}
            onSelectionChange={onSelectionChange}
            pageSize={25}
          />
        )}
      </div>

      {/* Price List Editor */}
      {selectedProductForPrices && (
        <PriceListReport
          product={selectedProductForPrices}
          visible={priceEditorVisible}
          onHide={handleHidePriceEditor}
        />
      )}
    </>
  );
}
