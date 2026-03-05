import {
  type ProductEntity,
  getIncomePrice,
  getOutcomePrice,
  getSalePrice,
} from "@/entities/product";
import type { PriceEntity } from "@/shared/bindings/PriceEntity";
import type { PriceType } from "@/shared/bindings/PriceType";
import { Badge } from "@/shared/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area";
import { t } from "i18next";
import { Calendar as CalendarIcon, Tag, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface PriceListReportProps {
  product: ProductEntity;
  visible: boolean;
  onHide: () => void;
}

export function PriceListReport({
  product,
  visible,
  onHide,
}: PriceListReportProps) {
  const [priceHistory, setPriceHistory] = useState<PriceEntity[]>([]);

  useEffect(() => {
    if (visible && product) {
      const currentPrices = product.prices || [];
      // Sort prices by start_time in descending order (newest first)
      const sortedPrices = [...currentPrices].sort(
        (a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
      setPriceHistory(sortedPrices);
    }
  }, [visible, product]);

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

  const handleClose = () => {
    onHide();
  };

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t("product.price_history")} - {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 ">
          {/* Current Prices Summary */}
          <Card className="p-0 mb-1">
            <CardHeader className="">
              <CardTitle className="flex items-center gap-2 ">
                <TrendingUp className="h-5 w-5" />
                {t("product.current_price")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-1 m-0">
              <div className="grid grid-cols-3 gap-2 p-0">
                <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">
                      {t("product.sale")}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-green-800">
                    {formatPrice(getSalePrice(product))}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-700">
                      {t("product.income")}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-blue-800">
                    {formatPrice(getIncomePrice(product))}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-red-700">
                      {t("product.outcome")}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-red-800">
                    {formatPrice(getOutcomePrice(product))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price History */}
          <Card>
            {/* <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {t("product.price_history")}
              </CardTitle>
            </CardHeader> */}
            <CardContent className="p-1">
              <ScrollArea className="h-[400px]">
                {priceHistory.length > 0 ? (
                  <div className="space-y-2 ">
                    {priceHistory.map((priceEntry, index) => (
                      <div
                        key={priceEntry.id || `price-${index}`}
                        className="p-2 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
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

                            {/* Status Badges */}
                            <div className="flex gap-1">
                              <Badge
                                variant={index === 0 ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {index === 0
                                  ? t("product.current_active")
                                  : t("product.historical")}
                              </Badge>
                              {/* {index === 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-green-600 border-green-200"
                                >
                                  {t("product.in_effect")}
                                </Badge>
                              )} */}
                            </div>
                          </div>
                        </div>

                        {/* Timeline indicator for non-current prices */}
                        {index < priceHistory.length - 1 && (
                          <div className="mt-2 text-xs text-muted-foreground pl-3 border-l-2   border-muted">
                            {/* Start Date */}
                            {formatDate(priceEntry.start_time)}-
                            {formatDate(priceHistory[index + 1].start_time)}
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
                      {t("product.no_price_data_available")}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
