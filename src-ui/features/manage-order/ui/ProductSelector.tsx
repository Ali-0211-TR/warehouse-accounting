import { useOrderStore } from "@/entities/order";
import { getSalePrice, useProductStore } from "@/entities/product";
import { useUserStore } from "@/entities/user";
import { ProductEntity } from "@/shared/bindings/ProductEntity";
import { cn } from "@/shared/lib/utils";
import { ProductImagePreview } from "@/shared/ui/components/ProductImagePreview";
import { NumericInput } from "@/shared/ui/NumericInput";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { InputGroup } from "@/shared/ui/shadcn/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import { useVirtualizer } from "@tanstack/react-virtual";
import { t } from "i18next";
import { Barcode, Check, ChevronsUpDown, Hash, Plus, Search } from "lucide-react";
import * as React from "react";
import { Input } from "@/shared/ui/shadcn/input";

type ProductSelectorProps = {
  className?: string;
};

export const ProductSelector = React.memo(function ProductSelector({ className = "" }: ProductSelectorProps) {
  const products = useProductStore((s) => s.products);
  const loadProducts = useProductStore((s) => s.loadProducts);
  const selectedOrder = useOrderStore((s) => s.selectedOrder);
  const addOrderItem = useOrderStore((s) => s.addOrderItem);
  const { activeRole: _activeRole } = useUserStore();

  const [open, setOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] =
    React.useState<ProductEntity | null>(null);
  const [quantity, setQuantity] = React.useState<number>(1);
  const [customPrice, setCustomPrice] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  React.useEffect(() => {
    if (selectedProduct) {
      setCustomPrice(getSalePrice(selectedProduct));
    }
  }, [selectedProduct]);

  // Filter products based on order type
  const filteredProducts = React.useMemo(() => {
    if (!selectedOrder) return [];

    // Show all products for all order types
    return products;
  }, [products, selectedOrder?.order_type]);

  // Client-side search filtering
  const searchFilteredProducts = React.useMemo(() => {
    if (!searchQuery.trim()) return filteredProducts;
    const query = searchQuery.toLowerCase().trim();
    return filteredProducts.filter(product => {
      const name = product.name?.toLowerCase() ?? "";
      const shortName = product.short_name?.toLowerCase() ?? "";
      const article = product.article?.toLowerCase() ?? "";
      const barCode = product.bar_code?.toLowerCase() ?? "";
      return name.includes(query) || shortName.includes(query) || article.includes(query) || barCode.includes(query);
    });
  }, [filteredProducts, searchQuery]);

  // Virtualizer for product list
  const virtualizer = useVirtualizer({
    count: searchFilteredProducts.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  const handleProductSelect = (productId: string) => {
    const product = filteredProducts.find(p => p.id?.toString() === productId);
    setSelectedProduct(product || null);
    setOpen(false);
    setSearchQuery("");
  };

  const handleAddToOrder = async () => {
    if (!selectedProduct || !selectedOrder || !selectedProduct.id) return;

    try {
      await addOrderItem({
        order_id: selectedOrder.id!,
        product_id: selectedProduct.id,
        count: quantity,
      });

      // Reset form
      setSelectedProduct(null);
      setQuantity(1);
      setCustomPrice(null);
    } catch (error) {
      console.error("Failed to add product to order:", error);
    }
  };

  const isValid = selectedProduct && quantity > 0 && (customPrice ?? 0) >= 0;

  // Get placeholder text based on order type and user permissions
  const getPlaceholderText = () => {
    if (!selectedOrder) return t("placeholder.select_product");

    if (
      selectedOrder.order_type === "Sale"
    ) {
      return t("placeholder.select_product_or_service");
    }

    if (
      (selectedOrder.order_type === "Income" ||
        selectedOrder.order_type === "Outcome") &&
      false // canAddFuelProducts removed
    ) {
      return t("placeholder.select_product_including_fuel");
    }

    return t("placeholder.select_product");
  };

  return (
    <div className={`${className}`}>
      <InputGroup className="w-full flex-nowrap">
        {/* Product Selection - Takes all remaining space */}
        <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearchQuery(""); }}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "justify-between h-10 flex-1 min-w-0",
                selectedProduct ? "rounded-r-none border-r-0" : "rounded"
              )}
              disabled={!selectedOrder}
            >
              <span className="truncate overflow-hidden text-ellipsis flex-1 text-left">
                {selectedProduct ? selectedProduct.name : getPlaceholderText()}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] max-w-none p-0" align="start">
            <div className="flex flex-col">
              {/* Search input */}
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder={t("placeholder.search_product")}
                  className="h-9 border-0 shadow-none focus-visible:ring-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Virtualized product list */}
              <div
                ref={scrollContainerRef}
                className="max-h-[400px] overflow-y-auto"
                onWheel={(e) => { e.stopPropagation(); }}
              >
                {searchFilteredProducts.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {filteredProducts.length === 0 && selectedOrder?.order_type === "Sale"
                      ? t("message.no_products_or_services_found")
                      : t("message.no_products_found")}
                  </div>
                ) : (
                  <div
                    style={{
                      height: `${virtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                      const product = searchFilteredProducts[virtualRow.index];
                      return (
                        <div
                          key={product.id}
                          data-index={virtualRow.index}
                          ref={virtualizer.measureElement}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <div
                            className="flex items-start py-3 px-3 gap-3 cursor-pointer hover:bg-accent"
                            onClick={() => handleProductSelect(product.id?.toString() || "")}
                          >
                            {/* Left side - Main product info */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              {/* Product name and type */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <div>
                                  <ProductImagePreview product={product} />
                                </div>
                                <span className="font-semibold text-base truncate">
                                  {product.name}
                                </span>
                                {product.short_name && (
                                  <span className="text-sm text-muted-foreground">
                                    ({product.short_name})
                                  </span>
                                )}
                              </div>

                              {/* Article and Barcode row */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {product.article && (
                                  <div className="flex items-center gap-1 w-1/2">
                                    <Hash className="h-3 w-3 flex-shrink-0" />
                                    <Badge variant="outline" className="text-xs truncate">
                                      {product.article}
                                    </Badge>
                                  </div>
                                )}
                                {product.bar_code && (
                                  <div className="flex items-center gap-1 w-1/2">
                                    <Barcode className="h-3 w-3 flex-shrink-0" />
                                    <Badge variant="outline" className="text-xs font-mono truncate">
                                      {product.bar_code}
                                    </Badge>
                                  </div>
                                )}
                              </div>

                              {/* Price and Balance row */}
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">
                                    {t("product.price")}:
                                  </span>
                                  <span className="font-semibold text-green-600">
                                    {getSalePrice(product).toLocaleString()}{" "}
                                    {t("currency.sum")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">
                                    {t("product.balance")}:
                                  </span>
                                  <span
                                    className={cn(
                                      "font-semibold",
                                      (product.balance ?? 0) > 0
                                        ? "text-blue-600"
                                        : "text-red-600"
                                    )}
                                  >
                                    {product.balance ?? 0}
                                  </span>
                                  {product.unit?.short_name && (
                                    <span className="text-muted-foreground">
                                      {product.unit.short_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right side - Checkmark */}
                            <Check
                              className={cn(
                                "h-5 w-5 flex-shrink-0 mt-1",
                                selectedProduct?.id === product.id
                                  ? "opacity-100 text-primary"
                                  : "opacity-0"
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {selectedProduct && (
          <>
            {/* Quantity Selection with NumericInput and Virtual Keypad */}
            <div className="w-30 flex-shrink-0">
              <NumericInput
                value={quantity}
                onChange={value => {
                  // Ensure quantity is a positive number greater than 0
                  const validQuantity = Math.max(0, value || 0);
                  setQuantity(validQuantity);
                }}
                onEnterPress={handleAddToOrder}
                placeholder={t("placeholder.quantity")}
                className="[&>div]:w-full [&>div]:min-w-0 [&_input]:h-10 [&_input]:text-center [&_input]:rounded-none [&_input]:border-x-0"
                showNumpadButton={true}
              />
            </div>

            {/* Add Button - Only enabled when quantity > 0 */}
            <Button
              onClick={handleAddToOrder}
              disabled={!isValid || !selectedOrder || quantity <= 0}
              size="icon"
              className="rounded-l-none h-10 w-10 flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </>
        )}
      </InputGroup>
    </div>
  );
});
