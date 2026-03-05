import type { OrderEntity } from "@/entities/order";
import { OrderType } from "@/entities/order/model/types";
import { PrintChequeDialog } from "@/features/manage-order/ui/PrintChequeDialog";
import { PaginationInfo } from "@/shared/const/realworld.types";
import { getStrId } from "@/shared/helpers";
import { ServerEntityTable } from "@/shared/ui/components/ServerEntityTable";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { format } from "date-fns";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Package,
  RefreshCw,
  ShoppingCart,
  Truck,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AmountDisplay } from "./AmountDisplay";

interface OrderListProps {
  orders: OrderEntity[];
  loading: boolean;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  // onPageSizeChange: (pageSize: number) => void;
  onSort: (field: string, order: 1 | -1) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: OrderEntity[]) => void;
}

// Memoized order icon component
const OrderIcon = React.memo(({ orderType }: { orderType: OrderType }) => {
  switch (orderType) {
    case "Income":
      return <ArrowDownCircle className="h-4 w-4 text-blue-600" />;
    case "Outcome":
      return <ArrowUpCircle className="h-4 w-4 text-orange-600" />;
    case "Sale":
      return <ShoppingCart className="h-4 w-4 text-green-600" />;
    case "Returns":
      return <RefreshCw className="h-4 w-4 text-red-600" />;
    default:
      return <ShoppingCart className="h-4 w-4 text-gray-600" />;
  }
});
OrderIcon.displayName = "OrderIcon";

// Memoized status badge component
const StatusBadge = React.memo(({ order }: { order: OrderEntity }) => {
  const { t } = useTranslation();

  if (order.d_move) {
    return (
      <Badge className="text-xs bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        {t("order.status_completed", "Completed")}
      </Badge>
    );
  }

  return (
    <Badge className="text-xs bg-amber-50 text-amber-700 border-amber-200">
      <Clock className="h-3 w-3 mr-1" />
      {t("order.status_pending", "Pending")}
    </Badge>
  );
});
StatusBadge.displayName = "StatusBadge";

export const OrderReportList = React.memo(
  ({ orders, loading, pagination, onPageChange, onSort }: OrderListProps) => {
    const { t } = useTranslation();

    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [printedOrder, setPrintedOrder] = useState<OrderEntity | null>(null);

    // Calculate totals for better overview
    // const totals = useMemo(() => {
    //   const incoming = orders
    //     .filter(order =>
    //       ["Outcome", "Sale", "SaleDispenser"].includes(order.order_type)
    //     )
    //     .reduce((sum, order) => sum + order.summ, 0);
    //   const outgoing = orders
    //     .filter(order => ["Income", "Returns"].includes(order.order_type))
    //     .reduce((sum, order) => sum + order.summ, 0);
    //   return { incoming, outgoing, net: incoming - outgoing };
    // }, [orders]);

    // Memoized date formatter
    const formatDateTime = useCallback((dateTime: string) => {
      try {
        return format(new Date(dateTime), "dd.MM.yyyy HH:mm");
      } catch {
        return dateTime;
      }
    }, []);

    // Memoized order type color getter with better visual distinction
    const getOrderTypeColor = useCallback((orderType: string) => {
      switch (orderType) {
        case "Sale":
          return "bg-green-100 text-green-800 border-green-300 shadow-sm";
        case "Income":
          return "bg-blue-100 text-blue-800 border-blue-300 shadow-sm";
        case "Outcome":
          return "bg-orange-100 text-orange-800 border-orange-300 shadow-sm";
        case "Returns":
          return "bg-red-100 text-red-800 border-red-300 shadow-sm";
        default:
          return "bg-gray-100 text-gray-800 border-gray-300 shadow-sm";
      }
    }, []);

    // Get descriptive label for order type
    const getOrderTypeLabel = useCallback((orderType: string) => {
      switch (orderType) {
        case "Sale":
          return t("order.regular_sale", "Regular Sale");
        case "Income":
          return t("order.purchase", "Purchase");
        case "Outcome":
          return t("order.return_to_provider", "Return to Provider");
        case "Returns":
          return t("order.customer_return", "Customer Return");
        default:
          return orderType;
      }
    }, []);

    // Memoized amount formatter
    const formatAmount = useCallback((amount: number) => {
      return new Intl.NumberFormat("uz-UZ", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    }, []);

    const handlePrintCheque = useCallback((order: OrderEntity) => {
      setPrintedOrder(order);
      setPrintDialogOpen(true);
    }, []);

    // Memoized columns configuration
    const columns = useMemo(
      () => [
        {
          key: "id",
          header: t("order.id"),
          accessor: (order: OrderEntity) => order.id,
          width: "w-20",
          align: "center" as const,
          sortable: true,
          render: (order: OrderEntity) => (
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-xs font-mono">
                {getStrId(order.id ?? 0)}
              </Badge>
            </div>
          ),
        },
        {
          key: "order_type",
          header: t("order.order_type"),
          accessor: (order: OrderEntity) => order.order_type,
          width: "w-36",
          render: (order: OrderEntity) => (
            <Badge className={`text-xs ${getOrderTypeColor(order.order_type)}`}>
              <div className="flex items-center space-x-2">
                <OrderIcon orderType={order.order_type} />
                <span className="font-medium">
                  {getOrderTypeLabel(order.order_type)}
                </span>
              </div>
            </Badge>
          ),
        },
        // {
        //   key: "status",
        //   header: t("order.status", "Status"),
        //   accessor: (order: OrderEntity) =>
        //     order.d_move ? "completed" : "pending",
        //   width: "w-28",
        //   render: (order: OrderEntity) => <StatusBadge order={order} />,
        // },

        {
          key: "client",
          header: t("order.client"),
          accessor: (order: OrderEntity) => order.client?.name || "",
          sortable: true,
          render: (order: OrderEntity) =>
            order.client ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* <User className="h-4 w-4 text-blue-600 flex-shrink-0" /> */}
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {order.client.name}
                        </div>
                        {order.client.name_short && (
                          <div className="text-xs text-muted-foreground truncate">
                            {order.client.name_short}
                          </div>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{order.client.name}</p>
                      {order.client.name_short && (
                        <p className="text-sm text-muted-foreground">
                          {order.client.name_short}
                        </p>
                      )}
                      {order.client.contact && (
                        <p className="text-sm">{order.client.contact}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <span className="text-muted-foreground text-sm">
                {t("order.no_client", "No client")}
              </span>
            ),
        },
        {
          key: "d_created",
          header: t("order.d_created"),
          accessor: (order: OrderEntity) => order.d_created,
          width: "w-40",
          sortable: true,
          render: (order: OrderEntity) => (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {formatDateTime(order.d_created)}
                </div>
              </div>
            </div>
          ),
        },
        {
          key: "d_move",
          header: t("order.d_move"),
          accessor: (order: OrderEntity) => order.d_move || "",
          width: "w-40",
          sortable: true,
          render: (order: OrderEntity) =>
            order.d_move ? (
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    {formatDateTime(order.d_move)}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          key: "summ",
          header: t("order.summ"),
          accessor: (order: OrderEntity) => order.summ,
          width: "w-36",
          align: "right" as const,
          sortable: true,
          render: (order: OrderEntity) => (
            <AmountDisplay
              amount={order.summ}
              orderType={order.order_type}
              formatAmount={formatAmount}
            />
          ),
        },
        {
          key: "tax",
          header: t("order.tax"),
          accessor: (order: OrderEntity) => order.tax,
          width: "w-32",
          align: "right" as const,
          sortable: true,
          render: (order: OrderEntity) => (
            <div className="flex items-center justify-end space-x-1">
              {/* <CreditCard className="h-4 w-4 text-blue-600" /> */}
              <div className="text-right">
                <div className="font-medium text-sm text-blue-700">
                  {formatAmount(order.tax)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("currency.sum", "сум")}
                </div>
              </div>
            </div>
          ),
        },
        {
          key: "items_count",
          header: t("order.items"),
          accessor: (order: OrderEntity) => order.items?.length || 0,
          width: "w-20",
          align: "center" as const,
          render: (order: OrderEntity) => (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center space-x-1">
                    <Package className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">
                      {order.items?.length || 0}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {t("order.items_count", "{{count}} items", {
                      count: order.items?.length || 0,
                    })}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ),
        },
      ],
      [t, getOrderTypeColor, getOrderTypeLabel, formatDateTime, formatAmount]
    );

    // Memoized actions
    const getActions = useCallback(
      (order: OrderEntity) => (
        <div className="flex space-x-1">
          {order.d_move && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintCheque(order)}
                    className="h-8 px-2 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("order.print_cheque", "Print order receipt")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
      [handlePrintCheque, t]
    );

    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0">
          {/* Desktop / tablet: show table */}
          <div className="hidden sm:block">
            <ServerEntityTable
              data={orders}
              columns={columns}
              loading={loading}
              onSort={onSort}
              emptyMessage="message.no_data"
              actions={getActions}
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

          {/* Mobile: show list of cards */}
          <div className="block sm:hidden space-y-3 p-2">
            {orders.length === 0 && !loading ? (
              <div className="text-center text-sm text-muted-foreground py-6">
                {t("message.no_data")}
              </div>
            ) : (
              orders.map(order => (
                <div
                  key={order.id}
                  className="bg-card border border-border rounded-lg p-3 shadow-sm flex flex-col space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <Badge className="text-xs font-mono">
                        {getStrId(order.id ?? 0)}
                      </Badge>
                      <Badge className={`text-xs ${getOrderTypeColor(order.order_type)}`}>
                        <div className="flex items-center space-x-2">
                          <OrderIcon orderType={order.order_type} />
                          <span className="font-medium text-sm truncate">
                            {getOrderTypeLabel(order.order_type)}
                          </span>
                        </div>
                      </Badge>
                    </div>

                    <div className="flex-shrink-0">{getActions(order)}</div>
                  </div>

                  <div className="text-sm">
                    {order.client ? (
                      <div className="truncate">
                        <div className="font-medium">{order.client.name}</div>
                        {order.client.name_short && (
                          <div className="text-xs text-muted-foreground truncate">
                            {order.client.name_short}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        {t("order.no_client", "No client")}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span>{formatDateTime(order.d_created)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span>{order.d_move ? formatDateTime(order.d_move) : "—"}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-medium text-sm text-blue-700">
                        {formatAmount(order.summ)}
                      </div>
                      <div className="text-xs text-muted-foreground">{t("currency.sum", "сум")}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-orange-600" />
                      <div className="font-medium">{order.items?.length || 0}</div>
                    </div>

                    <div className="text-xs">
                      <div className="font-medium text-sm text-blue-700">{formatAmount(order.tax)}</div>
                      <div className="text-muted-foreground">{t("order.tax")}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Print Dialog */}
        <PrintChequeDialog
          open={printDialogOpen}
          onOpenChange={setPrintDialogOpen}
          order={printedOrder}
        />
      </div>
    );
  }
);

OrderReportList.displayName = "OrderList";
