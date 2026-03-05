import type { ProductEntity } from "@/entities/product";
import type { PriceEntity } from "@/shared/bindings/PriceEntity";
import type { PriceType } from "@/shared/bindings/PriceType";
import { dateToISOString } from "@/shared/helpers";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import { NumericInput } from "@/shared/ui/NumericInput";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Calendar } from "@/shared/ui/shadcn/calendar";
import { Card, CardContent, CardHeader } from "@/shared/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { InputGroup } from "@/shared/ui/shadcn/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import { Calendar as CalendarIcon, Plus, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useProductStore } from "@/entities/product";
import { useToast } from "@/shared/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface PriceListEditorProps {
  product: ProductEntity;
  visible: boolean;
  onHide: () => void;
}

export function PriceListEditor({
  product,
  visible,
  onHide,
}: PriceListEditorProps) {
  const [editingPrices, setEditingPrices] = useState<PriceEntity[]>([]);
  const [deletePrice, setDeletePrice] = useState<PriceEntity | null>(null);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const { t } = useTranslation();
  const { showErrorToast, showSuccessToast } = useToast();
  const allProducts = useProductStore((s) => s.products);
  const savePrice = useProductStore((s) => s.savePrice);
  const deletePriceFromStore = useProductStore((s) => s.deletePrice);
  const loadProducts = useProductStore((s) => s.loadProducts);
  const loading = useProductStore((s) => s.loading);

  // Form state for adding new prices
  const [newPriceForm, setNewPriceForm] = useState({
    price_type: "Sale" as PriceType,
    value: 0,
    date: new Date(),
  });

  useEffect(() => {
    if (visible && product) {
      // Get the updated product from the store to ensure we have the latest prices
      const updatedProduct =
        allProducts.find(p => p.id === product.id) || product;
      const currentPrices = updatedProduct.prices || [];

      // Sort prices by start_time in descending order (newest first)
      const sortedPrices = [...currentPrices].sort(
        (a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
      setEditingPrices([...sortedPrices]);
    }
  }, [visible, product, allProducts]);

  useEffect(() => {
    // Set default value based on price type
    if (newPriceForm.price_type) {
      setNewPriceForm(prev => ({
        ...prev,
        value: getCurrentPriceByType(newPriceForm.price_type),
      }));
    }
  }, [newPriceForm.price_type, product]);

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "—";
    return (
      new Intl.NumberFormat("uz-UZ", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(numPrice) + " so'm"
    );
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  const getPriceTypeColor = (priceType: PriceType): string => {
    switch (priceType) {
      case "Sale":
        return "bg-green-50 text-green-700 border-green-200";
      case "Income":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Outcome":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getCurrentPriceByType = (priceType: PriceType): number => {
    // Use pre-computed fields from backend
    switch (priceType) {
      case "Sale":
        return product.sale_price ?? 0;
      case "Income":
        return product.income_price ?? 0;
      case "Outcome":
        return product.outcome_price ?? 0;
      default:
        return 0;
    }
  };

  const handleAddPrice = async () => {
    const startTime = dateToISOString(newPriceForm.date);

    const newPrice = {
      id: null,
      product_id: product.id!,
      value: newPriceForm.value,
      start_time: startTime,
      price_type: newPriceForm.price_type,
    };

    try {
      await savePrice(newPrice);
      showSuccessToast(t("success.prices_saved"));
      await loadProducts();

      // Reset form to current date
      setNewPriceForm(prev => ({
        ...prev,
        date: new Date(),
      }));

      // The useEffect will automatically update editingPrices when allProducts changes
      // No need to manually update the local state here
    } catch (error) {
      console.error("Failed to add price:", error);
      showErrorToast(error instanceof Error ? error.message : t("error.failed_to_save_prices"));
    }
  };

  const handleDeletePrice = (price: PriceEntity) => {
    setDeletePrice(price);
  };

  const confirmDeletePrice = async () => {
    if (deletePrice) {
      try {
        await deletePriceFromStore(deletePrice);
        showSuccessToast(t("success.price_deleted"));
        await loadProducts();
        setDeletePrice(null);

        // The useEffect will automatically update editingPrices when allProducts changes
        // No need to manually update the local state here
      } catch (error) {
        console.error("Failed to delete price:", error);
        showErrorToast(error instanceof Error ? error.message : t("error.failed_to_delete_price"));
        setDeletePrice(null);
      }
    }
  };

  const handleCancel = () => {
    onHide();
  };

  return (
    <>
      <Dialog open={visible} onOpenChange={handleCancel}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {t("product.manage_prices")} - {product.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Prices Summary */}
            <div className="grid grid-cols-3 gap-2 p-0">
              <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">
                    {t("product.sale")}
                  </span>
                </div>
                <div className="text-lg font-semibold text-green-800">
                  {formatPrice(product.sale_price ?? 0)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-700">
                    {t("product.income")}
                  </span>
                </div>
                <div className="text-lg font-semibold text-blue-800">
                  {formatPrice(product.income_price ?? 0)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-700">
                    {t("product.outcome")}
                  </span>
                </div>
                <div className="text-lg font-semibold text-red-800">
                  {formatPrice(product.outcome_price ?? 0)}
                </div>
              </div>
            </div>

            {/* Price List */}
            <Card>
              <CardHeader className="px-4">
                <div className="flex items-end gap-2">
                  {/* Integrated Input Group with all fields */}
                  <InputGroup className="flex-1">
                    {/* Price Type Select */}
                    <Select
                      value={newPriceForm.price_type}
                      onValueChange={value =>
                        setNewPriceForm(prev => ({
                          ...prev,
                          price_type: value as PriceType,
                        }))
                      }
                    >
                      <SelectTrigger className="w-[140px] rounded-r-none border-r-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sale">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {t("product.sale")}
                          </div>
                        </SelectItem>
                        <SelectItem value="Income">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            {t("product.income")}
                          </div>
                        </SelectItem>
                        <SelectItem value="Outcome">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            {t("product.outcome")}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Price Value Input */}
                    <div className="w-32 flex-shrink-0">
                      <NumericInput
                        value={newPriceForm.value}
                        onChange={value =>
                          setNewPriceForm(prev => ({
                            ...prev,
                            value: value,
                          }))
                        }
                        onEnterPress={handleAddPrice}
                        placeholder={t("product.price")}
                        className="[&>div]:w-full [&_input]:h-10 [&_input]:text-center [&_input]:rounded-none [&_input]:border-x-0"
                        showNumpadButton={true}
                      />
                    </div>

                    {/* Date Picker */}
                    <Popover
                      open={datePopoverOpen}
                      onOpenChange={setDatePopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="rounded-none border-l-0 border-r-0 h-10 justify-start font-normal whitespace-nowrap flex-1"
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {formatDate(newPriceForm.date)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={newPriceForm.date}
                          captionLayout="dropdown"
                          onSelect={date => {
                            if (date) {
                              setNewPriceForm(prev => ({ ...prev, date }));
                            }
                            setDatePopoverOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Add Button */}
                    <Button
                      onClick={handleAddPrice}
                      disabled={
                        !newPriceForm.value ||
                        newPriceForm.value <= 0 ||
                        loading
                      }
                      size="icon"
                      className="rounded-l-none h-10 w-10 flex-shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </InputGroup>
                </div>
              </CardHeader>

              <CardContent>
                <ScrollArea className="h-[400px]">
                  {editingPrices.length > 0 ? (
                    <div className="space-y-2">
                      {editingPrices.map((priceEntry, index) => (
                        <div
                          key={priceEntry.id || `new-${index}`}
                          className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {/* Price Type Badge */}
                              <Badge
                                variant="outline"
                                className={`text-xs ${getPriceTypeColor(
                                  priceEntry.price_type
                                )}`}
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {t(
                                  `product.${priceEntry.price_type.toLowerCase()}`
                                )}
                              </Badge>

                              {/* Price Value */}
                              <div className="text-lg font-semibold">
                                {formatPrice(priceEntry.value)}
                              </div>

                              {/* Start Date */}
                              <div className="text-sm text-muted-foreground">
                                {t("product.from")}{" "}
                                {formatDate(priceEntry.start_time)}
                              </div>
                            </div>

                            {/* Delete Button */}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeletePrice(priceEntry)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Timeline indicator for non-current prices */}
                          {index < editingPrices.length - 1 && (
                            <div className="mt-2 text-xs text-muted-foreground pl-3 border-l-2 border-muted">
                              {t("product.until")}{" "}
                              {formatDate(editingPrices[index + 1].start_time)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">
                        {t("product.no_price_history")}
                      </p>
                      <p className="text-sm mt-1">
                        {t("product.add_first_price_above")}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deletePrice}
        title={t("product.confirm_delete_price")}
        description={
          <>
            {t("product.delete_price_warning", {
              price: deletePrice ? formatPrice(deletePrice.value) : "",
              type: deletePrice
                ? t(`product.${deletePrice.price_type.toLowerCase()}`)
                : "",
            })}
            <br />
            <span className="text-red-600 font-medium">
              {t("message.action_irreversible")}
            </span>
          </>
        }
        confirmLabel={t("control.delete")}
        cancelLabel={t("control.cancel")}
        onConfirm={confirmDeletePrice}
        onCancel={() => setDeletePrice(null)}
        confirmClassName="bg-red-600 hover:bg-red-700"
      />
    </>
  );
}
