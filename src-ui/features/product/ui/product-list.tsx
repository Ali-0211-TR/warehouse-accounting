import { type ProductEntity, getActivePrices } from "@/entities/product";
import { useDeviceConfigStore } from "@/entities/device-config";
import { useSettingsState } from "@/entities/settings";
import type { PriceEntity } from "@/shared/bindings/PriceEntity";
import { useToast } from "@/shared/hooks/use-toast";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { EntityTable } from "@/shared/ui/components/EntityTable";
import { ServerEntityTable } from "@/shared/ui/components/ServerEntityTable";
import type { PaginationInfo } from "@/shared/const/realworld.types";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { DropdownMenuItem } from "@/shared/ui/shadcn/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Input } from "@/shared/ui/shadcn/input";
import { invoke } from "@tauri-apps/api/core";
import { Barcode, Hash, Package, Printer, ReceiptText,  } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PriceListEditor } from "./price-list-editor";

import { ProductImagePreview } from "@/shared/ui/components/ProductImagePreview";

// Converts Cyrillic to Latin and strips any non-ASCII characters.
// This is intentionally simple and dependency-free for printing hardware compatibility.
// const toLatinAscii = (input: string): string => {
//   const map: Record<string, string> = {
//     А: "A",
//     а: "a",
//     Б: "B",
//     б: "b",
//     В: "V",
//     в: "v",
//     Г: "G",
//     г: "g",
//     Д: "D",
//     д: "d",
//     Е: "E",
//     е: "e",
//     Ё: "Yo",
//     ё: "yo",
//     Ж: "Zh",
//     ж: "zh",
//     З: "Z",
//     з: "z",
//     И: "I",
//     и: "i",
//     Й: "Y",
//     й: "y",
//     К: "K",
//     к: "k",
//     Л: "L",
//     л: "l",
//     М: "M",
//     м: "m",
//     Н: "N",
//     н: "n",
//     О: "O",
//     о: "o",
//     П: "P",
//     п: "p",
//     Р: "R",
//     р: "r",
//     С: "S",
//     с: "s",
//     Т: "T",
//     т: "t",
//     У: "U",
//     у: "u",
//     Ф: "F",
//     ф: "f",
//     Х: "Kh",
//     х: "kh",
//     Ц: "Ts",
//     ц: "ts",
//     Ч: "Ch",
//     ч: "ch",
//     Ш: "Sh",
//     ш: "sh",
//     Щ: "Shch",
//     щ: "shch",
//     Ъ: "",
//     ъ: "",
//     Ы: "Y",
//     ы: "y",
//     Ь: "",
//     Э: "E",
//     э: "e",
//     Ю: "Yu",
//     ю: "yu",
//     Я: "Ya",
//     я: "ya",
//     Ў: "O'",
//     ў: "o'",
//     Қ: "Q",
//     қ: "q",
//     Ғ: "G'",
//     ғ: "g'",
//     Ҳ: "H",
//     ҳ: "h",
//   };

//   const transliterated = input
//     .split("")
//     .map((ch) => map[ch] ?? ch)
//     .join("");

//   // Keep printable ASCII only (helps quirky printer drivers / ESC/POS).
//   return transliterated.replace(/[^\x20-\x7E]/g, "");
// };

interface ProductListProps {
  products: ProductEntity[];
  loading: boolean;
  onEdit?: (product: ProductEntity) => void;
  onDelete?: (product: ProductEntity) => void;
  onSavePrices?: (productId: string, prices: PriceEntity[]) => Promise<void>;
  selectable?: boolean;
  onSelectionChange?: (selected: ProductEntity[]) => void;
  // Server-side pagination props
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onSort?: (field: string, order: 1 | -1) => void;
}

export function ProductList({
  products,
  loading,
  onEdit,
  onDelete,
  selectable = false,
  onSelectionChange,
  pagination,
  onPageChange,
  onSort,
}: ProductListProps) {
  const { deviceConfig } = useDeviceConfigStore();
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useToast();
  const { data: settingsData } = useSettingsState();
  const [deleteProduct, setDeleteProduct] = useState<ProductEntity | null>(
    null
  );
  const [priceEditorVisible, setPriceEditorVisible] = useState(false);
  const [selectedProductForPrices, setSelectedProductForPrices] =
    useState<ProductEntity | null>(null);

  const [printCopiesDialogOpen, setPrintCopiesDialogOpen] = useState(false);
  const [printCopiesValue, setPrintCopiesValue] = useState("1");
  const [printCopiesProduct, setPrintCopiesProduct] =
    useState<ProductEntity | null>(null);
  const [isPrintingLabel, setIsPrintingLabel] = useState(false);

  const handleDeleteClick = (product: ProductEntity) => {
    setDeleteProduct(product);
  };

  const handleDeleteConfirm = () => {
    if (deleteProduct && onDelete) {
      onDelete(deleteProduct);
      setDeleteProduct(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteProduct(null);
  };

  const handleShowPriceList = (product: ProductEntity) => {
    setSelectedProductForPrices(product);
    setPriceEditorVisible(true);
  };

  const handleHidePriceEditor = () => {
    setPriceEditorVisible(false);
    setSelectedProductForPrices(null);
  };

  const handlePrintLabel = async (product: ProductEntity, copies: number) => {
    try {
      // Check if user has a preferred label printer
      let printerName = settingsData?.labelPrinterName;

      // If no preferred label printer, get list of available printers
      if (!printerName) {
        const printersResponse = await invoke<{
          error: { message: string } | null;
          result: { data: string[] } | null;
        }>("get_printers");

        if (printersResponse.error || !printersResponse.result?.data?.length) {
          showErrorToast(
            t(
              "error.no_printer",
              "No printers found. Please check printer settings."
            )
          );
          return;
        }

        // Use first available printer as default
        printerName = printersResponse.result.data[0];
      } else {
      }

      // Get active price for the product
      const activePrices = getActivePrices(product);
      const price = activePrices.sale || 0;

      // Build label content from device-config template (fallback to a simple default)
      const labelTemplate: string =
        ((deviceConfig as any)?.label_template as string | undefined) ||
        "#{{sku}} | {{product_name}}";
      const labelText = labelTemplate
        .replace(/\{\{sku\}\}/g, product.article || "")
        .replace(/\{\{product_name\}\}/g, product.name)
      // Print requested number of copies
      for (let i = 0; i < copies; i++) {
        // Use new print_product_label backend command
        const response = await invoke<{
          error: { message: string } | null;
          result: { data: { success: boolean; message: string } } | null;
        }>("print_product_label", {
          params: {
            printer_name: printerName,
            product_name: labelText,
            barcode: product.bar_code || "",
            price: price,
            quantity: null, // No quantity for product labels
            sku: product.article || null,
            unit: product.unit?.name || "pcs",
            label_width: settingsData.labelPrinterWidth,
            label_height: "30mm", // Standard label height for XPrinter XP-365B
          },
        });

        if (response.error) {
          showErrorToast(
            t("error.print_failed", "Failed to print label: ") +
            response.error.message
          );
          return;
        }
      }

      showSuccessToast(
        t("product.label_printed", "Label printed successfully") + ` (${copies})`
      );
    } catch (error: any) {
      console.error("Failed to print label:", error);
      showErrorToast(
        t("error.print_failed", "Failed to print label") +
        ": " +
        (error.message || "Unknown error")
      );
    }
  };

  const openPrintCopiesDialog = (product: ProductEntity) => {
    setPrintCopiesProduct(product);
    setPrintCopiesValue("1");
    setPrintCopiesDialogOpen(true);
  };

  const handleConfirmPrintCopies = async () => {
    if (!printCopiesProduct) return;

    const copies = Math.max(
      1,
      Math.min(100, Number.parseInt(printCopiesValue, 10) || 1)
    );

    setIsPrintingLabel(true);
    try {
      await handlePrintLabel(printCopiesProduct, copies);
      setPrintCopiesDialogOpen(false);
      setPrintCopiesProduct(null);
    } finally {
      setIsPrintingLabel(false);
    }
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
    // Hidden ID column (UUID not user-friendly)
    // {
    //   key: "id",
    //   header: t("product.id"),
    //   accessor: (product: ProductEntity) => product.id,
    //   width: "w-16",
    //   align: "center" as const,
    // },
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
      key: "image",
      header: t("product.image"),
      accessor: (product: ProductEntity) => product.image_paths,
      width: "w-32",
      sortable: false,
      render: (product: ProductEntity) => {
        return <ProductImagePreview product={product} />;
      }

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
      sortable: false,
      accessor: (product: ProductEntity) => {
        const prices = getActivePrices(product);
        return prices.sale; // For sorting purposes
      },
      width: "w-48",
      align: "left" as const,
      render: (product: ProductEntity) => {
        const prices = getActivePrices(product);
        return (
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {t("product.sale")}:
              </span>
              <span className="font-mono font-medium text-green-700">
                {formatPrice(prices.sale)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {t("product.income")}:
              </span>
              <span className="font-mono text-blue-700">
                {formatPrice(prices.income)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {t("product.outcome")}:
              </span>
              <span className="font-mono text-orange-700">
                {formatPrice(prices.outcome)}
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
      sortable: false,
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
      sortable: false,
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
      sortable: false,
      render: (product: ProductEntity) => (
        <Badge variant="outline" className="text-xs">
          {product.group?.name || "—"}
        </Badge>
      ),
    },
  ];

  const actions = (product: ProductEntity) => (
    <>
      <DropdownMenuItem onClick={() => handleShowPriceList(product)}>
        <ReceiptText className="mr-2 h-4 w-4" />
        {t("product.manage_prices")}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => openPrintCopiesDialog(product)}>
        <Printer className="mr-2 h-4 w-4" />
        {t("product.print_label", "Print Label")}
      </DropdownMenuItem>
    </>
  );
  return (
    <>
      {/* Desktop: table on medium+ screens */}
      <div className="hidden md:block">
        {pagination && onPageChange ? (
          <ServerEntityTable
            data={products}
            columns={columns}
            loading={loading}
            onEdit={onEdit}
            onDelete={handleDeleteClick}
            onSort={onSort}
            actions={actions}
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
            onDelete={handleDeleteClick}
            actions={actions}
            emptyMessage={"message.no_data"}
            selectable={selectable}
            onSelectionChange={onSelectionChange}
            pageSize={25}
          />
        )}
      </div>

      {/* Mobile: card list on small screens */}
      <div className="block md:hidden">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t("message.loading", "Loading...")}
          </div>
        ) : products.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t("message.no_data")}
          </div>
        ) : (
          <div className="space-y-3 p-2">
            {products.map((product) => {
              const prices = getActivePrices(product);
              return (
                <div
                  key={product.id}
                  className="border rounded-lg p-3 bg-card shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.short_name}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant={getBalanceColor(product.balance) as any} className="text-xs">
                        {formatBalance(product.balance, product.unit)}
                      </Badge>
                      <div className="text-xs font-mono text-green-700">
                        {formatPrice(prices.sale)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Hash className="h-4 w-4" />
                      <span className="font-mono">{product.article || "—"}</span>
                    </div>

                    <div className="flex items-center justify-end space-x-2 text-muted-foreground">
                      <Barcode className="h-4 w-4" />
                      <span className="font-mono">{product.bar_code || "—"}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <span className="text-xs">{t("product.unit")}</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {product.unit?.short_name || "—"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-end space-x-2 text-muted-foreground">
                      <span className="text-xs">{t("product.group")}</span>
                      <Badge variant="outline" className="text-xs">
                        {product.group?.name || "—"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <button
                        type="button"
                        className="flex items-center px-2 py-1 rounded-md text-sm hover:bg-accent whitespace-nowrap"
                        onClick={() => handleShowPriceList(product)}
                      >
                        <ReceiptText className="mr-2 h-4 w-4" />
                        <span className="truncate max-w-[120px] block">{t("product.manage_prices")}</span>
                      </button>

                      {onEdit && (
                        <button
                          type="button"
                          className="flex items-center px-2 py-1 rounded-md text-sm hover:bg-accent whitespace-nowrap"
                          onClick={() => onEdit(product)}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M3 21v-3.75L14.06 6.19a2.5 2.5 0 0 1 3.54 0l.19.19a2.5 2.5 0 0 1 0 3.54L6.75 21H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          <span className="ml-1 truncate max-w-[80px] block">{t("control.edit")}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 min-w-0 justify-end">
                      <button
                        type="button"
                        className="flex items-center px-2 py-1 rounded-md text-sm hover:bg-accent whitespace-nowrap"
                        onClick={() => openPrintCopiesDialog(product)}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        <span className="truncate max-w-[120px] block">{t("product.print_label", "Print Label")}</span>
                      </button>

                      {onDelete && (
                        <button
                          type="button"
                          className="flex items-center px-2 py-1 rounded-md text-sm text-red-600 hover:bg-accent whitespace-nowrap"
                          onClick={() => handleDeleteClick(product)}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          <span className="ml-1 truncate max-w-[80px] block">{t("control.delete")}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Price List Editor */}
      {selectedProductForPrices && (
        <PriceListEditor
          product={selectedProductForPrices}
          visible={priceEditorVisible}
          onHide={handleHidePriceEditor}
        />
      )}

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteProduct}
        title={t("message.confirm_delete")}
        description={
          <>
            {t("message.delete_product_warning", { name: deleteProduct?.name })}
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

      {/* Print copies dialog */}
      <Dialog
        open={printCopiesDialogOpen}
        onOpenChange={(open) => {
          if (isPrintingLabel) return;
          setPrintCopiesDialogOpen(open);
          if (!open) {
            setPrintCopiesProduct(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("product.print_label", "Print Label")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "product.print_copies",
                "Сколько копий баркода распечатать?"
              )}
              {printCopiesProduct?.name ? ` (${printCopiesProduct.name})` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={printCopiesValue}
              onChange={(e) => setPrintCopiesValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirmPrintCopies();
                }
              }}
            />
            <div className="text-xs text-muted-foreground">
              {t("common.range", "Диапазон")}: 1100
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setPrintCopiesDialogOpen(false)}
              disabled={isPrintingLabel}
            >
              {t("control.cancel", "Cancel")}
            </Button>
            <Button onClick={handleConfirmPrintCopies} disabled={isPrintingLabel}>
              {t("control.print", "Print")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
