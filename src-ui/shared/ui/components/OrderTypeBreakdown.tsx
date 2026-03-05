import type { OrderTypeTotals } from "@/shared/bindings/dtos/OrderTypeTotals";
import { Badge } from "@/shared/ui/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Fuel,
  Package,
  PieChart as PieChartIcon,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { useTranslation } from "react-i18next";

/** Sub-breakdown for fuel vs goods within a card */
interface CategoryBreakdown {
  fuelSum: number;
  fuelTax: number;
  goodsSum: number;
  goodsTax: number;
}

interface OrderTypeBreakdownProps {
  totalsByType: OrderTypeTotals;
  /** Optional: show description lines under cards (shown in Movements page) */
  showDescriptions?: boolean;
  className?: string;
}

/**
 * Shared component that shows the 5-card breakdown by order type:
 * Regular Sale, Fuel Sale, Purchase, Return to Provider, Customer Return.
 *
 * Eliminates the ~200 lines of duplication between SummaryReportPage and MovementsReportPage.
 */
export function OrderTypeBreakdown({
  totalsByType,
  showDescriptions = false,
  className,
}: OrderTypeBreakdownProps) {
  const { t } = useTranslation();

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const cards = [
    {
      icon: ShoppingCart,
      label: t("order.type.sale", "Продажа"),
      badgeText: `+${t("order.revenue", "Доход")}`,
      badgeClass: "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200",
      bgClass: "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-700",
      iconClass: "text-green-600 dark:text-green-300",
      titleClass: "text-green-800 dark:text-green-200",
      amountClass: "text-green-700 dark:text-green-300",
      taxClass: "text-green-600 dark:text-green-300",
      totalClass: "text-green-800 dark:text-green-200",
      sum: totalsByType.saleSum,
      tax: totalsByType.saleTax,
      discount: totalsByType.saleDiscount,
      description: undefined,
      categoryBreakdown: undefined,
    },
    {
      icon: ArrowDownCircle,
      label: t("order.type.purchase", "Закупка"),
      badgeText: `-${t("order.expense", "Расход")}`,
      badgeClass: "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200",
      bgClass: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-700",
      iconClass: "text-blue-600 dark:text-blue-300",
      titleClass: "text-blue-800 dark:text-blue-200",
      amountClass: "text-blue-700 dark:text-blue-300",
      taxClass: "text-blue-600 dark:text-blue-300",
      totalClass: "text-blue-800 dark:text-blue-200",
      sum: totalsByType.incomeSum,
      tax: totalsByType.incomeTax,
      discount: totalsByType.incomeDiscount,
      description: t("order.purchase_description", "💸 Затраты на закупку товара"),
      categoryBreakdown: {
        fuelSum: totalsByType.incomeFuelSum,
        fuelTax: totalsByType.incomeFuelTax,
        goodsSum: totalsByType.incomeGoodsSum,
        goodsTax: totalsByType.incomeGoodsTax,
      } as CategoryBreakdown,
    },
    {
      icon: ArrowUpCircle,
      label: t("order.type.return_provider", "Возврат поставщику"),
      badgeText: `+${t("order.refund", "Возврат")}`,
      badgeClass: "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200",
      bgClass: "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-700",
      iconClass: "text-orange-600 dark:text-orange-300",
      titleClass: "text-orange-800 dark:text-orange-200",
      amountClass: "text-orange-700 dark:text-orange-300",
      taxClass: "text-orange-600 dark:text-orange-300",
      totalClass: "text-orange-800 dark:text-orange-200",
      sum: totalsByType.outcomeSum,
      tax: totalsByType.outcomeTax,
      discount: totalsByType.outcomeDiscount,
      description: t("order.provider_return_description", "💰 Возврат средств от поставщика"),
      categoryBreakdown: {
        fuelSum: totalsByType.outcomeFuelSum,
        fuelTax: totalsByType.outcomeFuelTax,
        goodsSum: totalsByType.outcomeGoodsSum,
        goodsTax: totalsByType.outcomeGoodsTax,
      } as CategoryBreakdown,
    },
    {
      icon: RefreshCw,
      label: t("order.type.customer_return", "Возврат покупателя"),
      badgeText: `-${t("order.refund", "Возврат")}`,
      badgeClass: "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200",
      bgClass: "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-700",
      iconClass: "text-red-600 dark:text-red-300",
      titleClass: "text-red-800 dark:text-red-200",
      amountClass: "text-red-700 dark:text-red-300",
      taxClass: "text-red-600 dark:text-red-300",
      totalClass: "text-red-800 dark:text-red-200",
      sum: totalsByType.returnsSum,
      tax: totalsByType.returnsTax,
      discount: totalsByType.returnsDiscount,
      description: t("order.customer_return_description", "💸 Возврат средств покупателям"),
      categoryBreakdown: undefined,
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <PieChartIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
          <span>
            {t("order.detailed_breakdown", "Детализация по типам операций")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            const total = card.sum + card.tax;

            return (
              <div
                key={card.label}
                className={`p-4 border rounded-lg ${card.bgClass}`}
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center mb-2">
                  <Icon className={`h-4 w-4 ${card.iconClass}`} />
                  <span className={`font-medium ml-2 ${card.titleClass}`}>
                    {card.label}
                  </span>
                  <div className="mt-2 md:mt-0 md:ml-auto flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${card.badgeClass}`}
                    >
                      {card.badgeText}
                    </Badge>
                    <div className={`text-sm font-semibold ${card.totalClass}`}>
                      {formatAmount(total)}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {t("order.amount", "Сумма")}:
                    </span>
                    <span className={`text-sm font-semibold ${card.amountClass}`}>
                      {formatAmount(card.sum)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {t("order.tax", "Налог")}:
                    </span>
                    <span className={`text-sm font-semibold ${card.taxClass}`}>
                      {formatAmount(card.tax)}
                    </span>
                  </div>
                  {card.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {t("order.discount", "Скидка")}:
                      </span>
                      <span className="text-sm font-semibold text-orange-600 dark:text-orange-300">
                        {formatAmount(card.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1 border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-medium dark:text-gray-200">
                      {t("order.total", "Итого")}:
                    </span>
                    <span className={`text-sm font-bold ${card.totalClass}`}>
                      {formatAmount(total)}
                    </span>
                  </div>
                  {showDescriptions && card.description && (
                    <p className={`text-xs mt-1 ${card.taxClass}`}>
                      {card.description}
                    </p>
                  )}
                  {/* Sub-breakdown by product category: fuel vs goods */}
                  {card.categoryBreakdown && (card.categoryBreakdown.fuelSum + card.categoryBreakdown.fuelTax + card.categoryBreakdown.goodsSum + card.categoryBreakdown.goodsTax) > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t("order.by_category", "По категориям")}:
                      </span>
                      {(card.categoryBreakdown.fuelSum + card.categoryBreakdown.fuelTax) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Fuel className="h-3 w-3" />
                            {t("order.category_fuel", "Топливо")}:
                          </span>
                          <span className={`text-sm font-semibold ${card.amountClass}`}>
                            {formatAmount(card.categoryBreakdown.fuelSum + card.categoryBreakdown.fuelTax)}
                          </span>
                        </div>
                      )}
                      {(card.categoryBreakdown.goodsSum + card.categoryBreakdown.goodsTax) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {t("order.category_goods", "Товары")}:
                          </span>
                          <span className={`text-sm font-semibold ${card.amountClass}`}>
                            {formatAmount(card.categoryBreakdown.goodsSum + card.categoryBreakdown.goodsTax)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
