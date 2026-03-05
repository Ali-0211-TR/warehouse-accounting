import type { OrderEntity } from "@/entities/order";
import { OrderType } from "@/entities/order/model/types";
import { PrintChequeDialog } from "@/features/manage-order/ui/PrintChequeDialog";
import { PaginationInfo } from "@/shared/const/realworld.types";
import { ConfirmationDialog } from "@/shared/ui/components/ConfirmationDialog";
import {
  ServerEntityCards,
  type CardAction,
} from "@/shared/ui/components/ServerEntityCards";
import { ServerEntityTable } from "@/shared/ui/components/ServerEntityTable";
import { Badge } from "@/shared/ui/shadcn/badge";
import { DropdownMenuItem } from "@/shared/ui/shadcn/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  Package,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AmountDisplay } from "./AmountDisplay";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/shared/ui/shadcn/alert-dialog";
import { Button } from "@/shared/ui/shadcn/button";
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area";
import { useUserStore } from "@/entities/user";

// Helper function to shorten UUID for display (last 8 characters)
const shortenOrderId = (orderId: string): string => {
  if (!orderId || orderId.length <= 8) return orderId;
  return orderId.slice(-8);
};

interface OrderListProps {
  orders: OrderEntity[];
  loading: boolean;
  pagination: PaginationInfo;
  onEdit: (order: OrderEntity) => void;
  onView: (order: OrderEntity) => void;
  onDelete: (order: OrderEntity) => void;
  onMove: (order: OrderEntity) => void;
  onPageChange: (page: number) => void;
  onSort: (field: string, order: 1 | -1) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: OrderEntity[]) => void;
}

// ✅ чтобы не делать динамические ключи в i18n
const ORDER_TYPE_KEY: Record<string, string> = {
  Sale: "order.type.sale",
  Income: "order.type.income",
  Returns: "order.type.returns",
  Outcome: "order.type.outcome",
};

const LIST_ORDER_TYPE_KEY: Record<string, string> = {
  Sale: "lists.order_type.sale",
  Income: "lists.order_type.income",
  Returns: "lists.order_type.returns",
  Outcome: "lists.order_type.outcome",
};

const PAYMENT_TYPE_KEY: Record<string, string> = {
  cash: "payment.type.cash",
  card: "payment.type.card",
  terminal: "payment.type.terminal",
  transfer: "payment.type.transfer",
  click: "payment.type.click",
  payme: "payment.type.payme",
};

// Memoized order icon component
const OrderIcon = React.memo(({ orderType }: { orderType: OrderType }) => {
  if (orderType === "Income" || orderType === "Returns") {
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  }
  return <TrendingUp className="h-4 w-4 text-green-600" />;
});
OrderIcon.displayName = "OrderIcon";

// Memoized status badge component (✅ без лишних fallback-строк)
const StatusBadge = React.memo(({ order }: { order: OrderEntity }) => {
  const { t } = useTranslation();

  if (order.d_move) {
    return (
      <Badge className="text-xs bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        {t("order.status_moved")}
      </Badge>
    );
  }

  return (
    <Badge className="text-xs bg-orange-50 text-orange-700 border-orange-200">
      <Clock className="h-3 w-3 mr-1" />
      {t("order.status_pending")}
    </Badge>
  );
});
StatusBadge.displayName = "StatusBadge";

export const OrderList = React.memo(
  ({
    orders,
    loading,
    pagination,
    onEdit,
    onDelete,
    onPageChange,
    onSort,
    selectable = false,
    onSelectionChange,
  }: OrderListProps) => {
    const { t } = useTranslation();
    const [deleteOrder, setDeleteOrder] = useState<OrderEntity | null>(null);
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [printedOrder, setPrintedOrder] = useState<OrderEntity | null>(null);

    const [viewChequeOpen, setViewChequeOpen] = useState(false);
    const [viewedOrder, setViewedOrder] = useState<OrderEntity | null>(null);

    const { currentUser } = useUserStore();

    // Orders already come sorted from backend — no redundant client-side sort
    const sortedOrders = orders;

    const handleViewCheque = useCallback((order: OrderEntity) => {
      setViewedOrder(order);
      setViewChequeOpen(true);
    }, []);

    const formatDateTime = useCallback((dateTime: string) => {
      try {
        return format(new Date(dateTime), "dd.MM.yyyy HH:mm");
      } catch {
        return dateTime;
      }
    }, []);

    const getOrderTypeColor = useCallback((orderType: string) => {
      switch (orderType) {
        case "Sale":
          return "bg-green-100 text-green-800 border-green-200";
        case "Income":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "Returns":
          return "bg-red-100 text-red-800 border-red-200";
        case "Outcome":
          return "bg-orange-100 text-orange-800 border-orange-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    }, []);

    const formatAmount = useCallback((amount: number) => {
      return new Intl.NumberFormat("uz-UZ", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    }, []);

    const handleDeleteClick = useCallback((order: OrderEntity) => {
      setDeleteOrder(order);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
      if (deleteOrder) {
        onDelete(deleteOrder);
        setDeleteOrder(null);
      }
    }, [deleteOrder, onDelete]);

    const handlePrintCheque = useCallback((order: OrderEntity) => {
      setPrintedOrder(order);
      setPrintDialogOpen(true);
    }, []);

    // ---------- ЧЕК helpers ----------
    const safeNum = useCallback((v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    }, []);

    const getQty = useCallback(
      (it: any) => safeNum(it?.quantity ?? it?.qty ?? it?.count ?? it?.amount ?? 1),
      [safeNum]
    );

    const getPrice = useCallback(
      (it: any) => safeNum(it?.price ?? it?.unit_price ?? it?.cost ?? it?.summ ?? it?.total),
      [safeNum]
    );

    const getLineTotal = useCallback(
      (it: any) =>
        safeNum(
          it?.total ??
            it?.line_total ??
            it?.summ ??
            (getQty(it) * getPrice(it))
        ),
      [getPrice, getQty, safeNum]
    );

    const money = useCallback((v: any) => formatAmount(safeNum(v)), [formatAmount, safeNum]);

    const paymentLabel = useCallback(
      (p: any) => {
        const raw = String(p?.payment_type ?? p?.type ?? "").toLowerCase().trim();
        const key = PAYMENT_TYPE_KEY[raw];
        return key ? t(key) : raw || t("payment.unknown");
      },
      [t]
    );

    // Render function for order card
    const renderOrderCard = useCallback(
      (order: OrderEntity) => {
        const typeKey = LIST_ORDER_TYPE_KEY[order.order_type] ?? "lists.order_type.unknown";

        return (
          <>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <OrderIcon orderType={order.order_type} />
                  <h3 className="font-semibold truncate">
                    #{order.id ? shortenOrderId(order.id) : "—"}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge className={`text-xs ${getOrderTypeColor(order.order_type)}`}>
                    {t(typeKey)}
                  </Badge>
                  <StatusBadge order={order} />
                </div>
              </div>

              <AmountDisplay
                amount={order.summ}
                orderType={order.order_type}
                formatAmount={formatAmount}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {order.client && (
                <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                  <Package className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{t("order.client")}</p>
                    <p className="text-xs font-medium truncate">{order.client.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5 min-w-0">
                <Calendar className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t("order.d_created")}</p>
                  <p className="text-xs font-medium truncate">{formatDateTime(order.d_created)}</p>
                </div>
              </div>

              {order.d_move && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Truck className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{t("order.d_move")}</p>
                    <p className="text-xs font-medium truncate">{formatDateTime(order.d_move)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5 min-w-0">
                <FileText className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t("order.items")}</p>
                  <p className="text-xs font-medium">{order.items?.length || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 min-w-0">
                <ShoppingCart className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t("order.tax")}</p>
                  <p className="text-xs font-medium">
                    {formatAmount(order.tax)} {t("currency.sum")}
                  </p>
                </div>
              </div>
            </div>
          </>
        );
      },
      [formatAmount, formatDateTime, formatAmount, getOrderTypeColor, t]
    );

    const getOrderCardActions = useCallback(
      (order: OrderEntity): CardAction<OrderEntity>[] => {
        const actions: CardAction<OrderEntity>[] = [];

        if (!order.d_move) {
          actions.push({
            label: t("control.edit"),
            icon: <Edit className="h-4 w-4 mr-2" />,
            onClick: () => onEdit(order),
          });


        }

        if (order.d_move) {
          actions.push({
            label: t("order.print_cheque"),
            icon: <FileText className="h-4 w-4 mr-2" />,
            onClick: () => handlePrintCheque(order),
          });

          actions.push({
            label: t("order.view_cheque"),
            icon: <Eye className="h-4 w-4 mr-2" />,
            onClick: () => handleViewCheque(order),
          });
        }

        if (currentUser?.roles?.includes("Administrator")) {
            actions.push({
              label: t("control.delete"),
              icon: <Trash2 className="h-4 w-4 mr-2" />,
              onClick: () => handleDeleteClick(order),
              className: "text-destructive focus:text-destructive",
              separatorBefore: true,
            });
          }


        return actions;
      },
      [currentUser?.roles, handleDeleteClick, handlePrintCheque, handleViewCheque, onEdit, t]
    );

    const columns = useMemo(
      () => [
        {
          key: "id",
          header: t("order.id"),
          accessor: (order: OrderEntity) => order.id,
          width: "w-24",
          align: "center" as const,
          sortable: true,
          render: (order: OrderEntity) => (
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-xs font-mono">
                {shortenOrderId(order.id ?? "")}
              </Badge>
            </div>
          ),
        },
        {
          key: "order_type",
          header: t("order.order_type"),
          accessor: (order: OrderEntity) => order.order_type,
          width: "w-32",
          render: (order: OrderEntity) => {
            const key = ORDER_TYPE_KEY[order.order_type] ?? "order.type.unknown";
            return (
              <Badge className={`text-xs ${getOrderTypeColor(order.order_type)}`}>
                <div className="flex items-center space-x-1">
                  <ShoppingCart className="h-3 w-3" />
                  <span>{t(key)}</span>
                </div>
              </Badge>
            );
          },
        },
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
                      {order.client.contact && <p className="text-sm">{order.client.contact}</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <span className="text-muted-foreground text-sm">{t("order.no_client")}</span>
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
                <div className="text-sm font-medium">{formatDateTime(order.d_created)}</div>
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
                  <div className="text-sm font-medium">{formatDateTime(order.d_move)}</div>
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
          width: "w-28",
          align: "right" as const,
          sortable: true,
          render: (order: OrderEntity) => (
            <div className="flex items-center justify-end space-x-1">
              <div className="text-right">
                <div className="font-medium text-sm">{formatAmount(order.tax)}</div>
                <div className="text-xs text-muted-foreground">{t("currency.sum")}</div>
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
                    <span className="font-medium">{order.items?.length || 0}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("order.items_count", { count: order.items?.length || 0 })}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ),
        },
      ],
      [t, getOrderTypeColor, formatDateTime, formatAmount]
    );

    const IS_DEV = import.meta.env.DEV;

    const getActions = useCallback(
      (order: OrderEntity) => (
        <>
          {!order.d_move && (
            <>
              <DropdownMenuItem onClick={() => onEdit(order)}>
                <Edit className="h-4 w-4 mr-2" />
                {t("control.edit")}
              </DropdownMenuItem>


            </>
          )}

          {order.d_move && (
            <>
              <DropdownMenuItem onClick={() => handlePrintCheque(order)}>
                <FileText className="h-4 w-4 mr-2" />
                {t("order.print_cheque")}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleViewCheque(order)}>
                <Eye className="h-4 w-4 mr-2" />
                {t("order.view_cheque")}
              </DropdownMenuItem>
            </>
          )}

          {(currentUser?.roles?.includes("Administrator") || IS_DEV) && (
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(order)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("control.delete")}
                </DropdownMenuItem>
              )}


        </>
      ),
      [IS_DEV, currentUser?.roles, handleDeleteClick, handlePrintCheque, handleViewCheque, onEdit, t]
    );

    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0">
          {/* Card View */}
          <div className="lg:hidden px-3 sm:px-4">
            <ServerEntityCards
              data={sortedOrders}
              loading={loading}
              pagination={pagination}
              onPageChange={onPageChange}
              renderCard={renderOrderCard}
              customActions={getOrderCardActions}
              showDefaultActions={false}
            />
          </div>

          {/* Table View */}
          <div className="hidden lg:block">
            <ServerEntityTable
              data={sortedOrders}
              columns={columns}
              loading={loading}
              onSort={onSort}
              emptyMessage="message.no_data"
              selectable={selectable}
              onSelectionChange={onSelectionChange}
              actions={getActions}
              onGoToPage={(pageIndex0) => onPageChange(pageIndex0 + 1)}
              pageIndex={pagination.page - 1}
              pageCount={pagination.pageCount}
              canPreviousPage={pagination.page > 1}
              canNextPage={pagination.page < pagination.pageCount}
              onPreviousPage={() => onPageChange(pagination.page - 1)}
              onNextPage={() => onPageChange(pagination.page + 1)}
              totalCount={pagination.count}
            />
          </div>
        </div>

        <PrintChequeDialog
          open={printDialogOpen}
          onOpenChange={setPrintDialogOpen}
          order={printedOrder}
        />

        {/* View Cheque Dialog */}
        <AlertDialog open={viewChequeOpen} onOpenChange={setViewChequeOpen}>
          <AlertDialogContent
            className="
              p-0 overflow-hidden
              w-[100vw] h-[100vh] max-w-none rounded-none
              left-0 top-0 translate-x-0 translate-y-0
              sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]
              sm:h-auto sm:max-h-[85vh] sm:w-[95vw] sm:max-w-3xl sm:rounded-lg
            "
          >
            {(() => {
              const order = viewedOrder;

              const payments = (order?.payments || []) as any[];
              const items = (order?.items || []) as any[];

              const subtotal = items.reduce((acc, it) => acc + getLineTotal(it), 0);
              const tax = safeNum(order?.tax);
              const total = safeNum(order?.summ ?? subtotal + tax);

              const paid = payments.reduce((acc, p) => acc + safeNum(p?.summ), 0);
              const change = Math.max(0, paid - total);
              const toPay = Math.max(0, total - paid);

              const isMoved = !!order?.d_move;

              const orderTypeKey =
                order?.order_type ? (ORDER_TYPE_KEY[order.order_type] ?? "order.type.unknown") : "";

              return (
                <>
                  {/* Header */}
                  <div className="p-4 border-b flex items-start justify-between gap-3 bg-muted/30">
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertDialogHeader className="min-w-0">
                          <AlertDialogTitle className="break-words">
                            {t("order.view_cheque")}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="break-words">
                            {t("order.cheque_details")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        {orderTypeKey && order?.order_type && (
                          <Badge className={`text-xs ${getOrderTypeColor(order.order_type)}`}>
                            {t(orderTypeKey)}
                          </Badge>
                        )}

                        {order && <StatusBadge order={order as any} />}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div className="font-mono">
                          #{order?.id ? shortenOrderId(order.id) : "—"}
                        </div>

                        {order?.d_created && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDateTime(order.d_created)}</span>
                          </div>
                        )}

                        {order?.d_move && (
                          <div className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5" />
                            <span>
                              {t("order.moved_at")} {formatDateTime(order.d_move)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setViewChequeOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Content */}
                  <ScrollArea className="h-[calc(100vh-128px)] sm:h-[calc(85vh-128px)]">
                    <div className="p-4 space-y-4 min-w-0">
                      {/* Summary cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-lg border bg-background p-3">
                          <div className="text-xs text-muted-foreground">{t("order.items")}</div>
                          <div className="mt-1 flex items-center justify-between">
                            <div className="text-lg font-semibold tabular-nums">{items.length}</div>
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>

                        <div className="rounded-lg border bg-background p-3">
                          <div className="text-xs text-muted-foreground">{t("order.tax")}</div>
                          <div className="mt-1 flex items-center justify-between">
                            <div className="text-lg font-semibold tabular-nums">
                              {money(tax)} {t("currency.sum")}
                            </div>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>

                        <div className="rounded-lg border bg-background p-3">
                          <div className="text-xs text-muted-foreground">{t("order.total")}</div>
                          <div className="mt-1 flex items-center justify-between">
                            <div className="text-lg font-semibold tabular-nums">
                              {money(total)} {t("currency.sum")}
                            </div>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>

                      {/* Client */}
                      <div className="rounded-lg border bg-background">
                        <div className="p-3 border-b flex items-center justify-between">
                          <div className="text-sm font-medium">{t("order.client")}</div>
                          <Badge variant="outline" className="text-xs">
                            {isMoved ? t("order.receipt_final") : t("order.receipt_draft")}
                          </Badge>
                        </div>

                        <div className="p-3">
                          {order?.client ? (
                            <div className="space-y-1">
                              <div className="font-medium text-sm break-words">{order.client.name}</div>
                              {order.client.name_short && (
                                <div className="text-xs text-muted-foreground break-words">
                                  {order.client.name_short}
                                </div>
                              )}
                              {order.client.contact && (
                                <div className="text-xs break-words">{order.client.contact}</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">{t("order.no_client")}</div>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="rounded-lg border bg-background overflow-hidden">
                        <div className="p-3 border-b flex items-center justify-between">
                          <div className="text-sm font-medium">{t("order.items")}</div>
                          <div className="text-xs text-muted-foreground">
                            {t("order.items_count", { count: items.length })}
                          </div>
                        </div>

                        {items.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground">{t("order.no_items")}</div>
                        ) : (
                          <div className="divide-y">
                            <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground bg-muted/30">
                              <div className="grid grid-cols-12 gap-2">
                                <div className="col-span-6 sm:col-span-7">{t("product.name")}</div>
                                <div className="col-span-2 text-right">{t("order.qty")}</div>
                                <div className="col-span-2 text-right hidden sm:block">{t("order.price")}</div>
                                <div className="col-span-4 sm:col-span-1 text-right">{t("order.sum")}</div>
                              </div>
                            </div>

                            {items.map((it: any, idx: number) => {
                              const name = it?.product?.name || it?.name || "—";
                              const qty = getQty(it);
                              const price = getPrice(it);
                              const lineTotal = getLineTotal(it);

                              return (
                                <div key={idx} className="px-3 py-2">
                                  <div className="grid grid-cols-12 gap-2 items-start">
                                    <div className="col-span-6 sm:col-span-7 min-w-0">
                                      <div className="text-sm font-medium break-words">{name}</div>

                                      {(it?.product?.article || it?.product?.barcode) && (
                                        <div className="text-xs text-muted-foreground break-words">
                                          {it?.product?.article && (
                                            <span className="mr-2">
                                              {t("product.article")}:{" "}
                                              <span className="font-mono">{String(it.product.article)}</span>
                                            </span>
                                          )}
                                          {it?.product?.barcode && (
                                            <span>
                                              {t("product.barcode")}:{" "}
                                              <span className="font-mono">{String(it.product.barcode)}</span>
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <div className="col-span-2 text-right tabular-nums text-sm">{qty}</div>

                                    <div className="col-span-2 text-right tabular-nums text-sm hidden sm:block">
                                      {money(price)}
                                    </div>

                                    <div className="col-span-4 sm:col-span-1 text-right tabular-nums text-sm font-semibold">
                                      {money(lineTotal)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Payments */}
                      <div className="rounded-lg border bg-background overflow-hidden">
                        <div className="p-3 border-b flex items-center justify-between">
                          <div className="text-sm font-medium">{t("payment.payments")}</div>
                          <div className="text-xs text-muted-foreground tabular-nums">
                            {money(paid)} {t("currency.sum")}
                          </div>
                        </div>

                        {payments.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground">{t("payment.no_payments")}</div>
                        ) : (
                          <div className="divide-y">
                            {payments.map((p: any, idx: number) => (
                              <div key={idx} className="px-3 py-2 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium break-words">{paymentLabel(p)}</div>
                                  {p?.d_created && (
                                    <div className="text-xs text-muted-foreground">
                                      {formatDateTime(String(p.d_created))}
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 tabular-nums text-sm font-semibold">
                                  {money(p?.summ)} {t("currency.sum")}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Totals */}
                      <div className="rounded-lg border bg-background overflow-hidden">
                        <div className="p-3 border-b">
                          <div className="text-sm font-medium">{t("order.summary")}</div>
                        </div>

                        <div className="p-3 space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-muted-foreground">{t("order.subtotal")}</div>
                            <div className="tabular-nums font-medium">
                              {money(subtotal)} {t("currency.sum")}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="text-muted-foreground">{t("order.tax")}</div>
                            <div className="tabular-nums font-medium">
                              {money(tax)} {t("currency.sum")}
                            </div>
                          </div>

                          <div className="h-px bg-border my-2" />

                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold">{t("order.total")}</div>
                            <div className="tabular-nums font-semibold">
                              {money(total)} {t("currency.sum")}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="text-muted-foreground">{t("payment.paid")}</div>
                            <div className="tabular-nums font-medium">
                              {money(paid)} {t("currency.sum")}
                            </div>
                          </div>

                          {toPay > 0 ? (
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-muted-foreground">{t("payment.to_pay")}</div>
                              <div className="tabular-nums font-semibold">
                                {money(toPay)} {t("currency.sum")}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-muted-foreground">{t("payment.change")}</div>
                              <div className="tabular-nums font-semibold">
                                {money(change)} {t("currency.sum")}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-muted-foreground text-center pt-1">
                        {t("order.receipt_footer")}
                      </div>
                    </div>
                  </ScrollArea>

                  {/* Footer */}
                  <div className="p-4 border-t bg-background">
                    <AlertDialogFooter className="flex-row justify-end gap-2">
                      <AlertDialogCancel>{t("control.close")}</AlertDialogCancel>
                    </AlertDialogFooter>
                  </div>
                </>
              );
            })()}
          </AlertDialogContent>
        </AlertDialog>

        <ConfirmationDialog
          open={!!deleteOrder}
          title={t("message.confirm_delete")}
          description={
            <div className="space-y-2">
              <p>{t("message.delete_order_warning", { id: deleteOrder?.id })}</p>
              <p className="text-red-600 font-medium text-sm">{t("message.action_irreversible")}</p>
            </div>
          }
          confirmLabel={t("control.delete")}
          cancelLabel={t("control.cancel")}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteOrder(null)}
          confirmClassName="bg-red-600 hover:bg-red-700"
        />
      </div>
    );
  }
);

OrderList.displayName = "OrderList";
