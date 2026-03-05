import { orderApi } from "@/entities/order/api/order-api";
import { OrderEntity } from "@/entities/order/model/types";
import { formatStringDate, getStrId } from "@/shared/helpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/shadcn/sheet";
import { t } from "i18next";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type OneDispenserHistorySheetProps = {
  open: boolean;
  dispenserId: string | null;
  onOpenChange: (open: boolean) => void;
};

const LIMIT_OPTIONS = [5, 10, 15, 20, 50];

export const OneDispenserHistorySheet = ({
  open,
  dispenserId,
  onOpenChange,
}: OneDispenserHistorySheetProps) => {
  const [orders, setOrders] = useState<OrderEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(15);

  useEffect(() => {
    if (open && dispenserId != null) {
      setLoading(true);
      setError(null);
      orderApi
        .getOneDispenserHistory(dispenserId, limit)
        .then(data => {
          setOrders(data);
          setLoading(false);
        })
        .catch(err => {
          setError(
            err?.message ||
              t("order.history_load_error", "Failed to load order history")
          );
          setLoading(false);
        });
    } else if (!open) {
      setOrders([]);
      setError(null);
    }
  }, [open, dispenserId, limit]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="max-w-4xl w-full flex flex-col h-full"
      >
        <SheetHeader className="flex-shrink-0 p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              {/* Shadcn Select for limit */}
              <Select
                value={String(limit)}
                onValueChange={v => setLimit(Number(v))}
              >
                <SelectTrigger
                  size="sm"
                  className="min-w-[60px]"
                  aria-label={t("order.history_limit", "Show last")}
                >
                  <SelectValue
                    placeholder={t("order.history_limit", "Show last")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {LIMIT_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={String(opt)}>
                      {opt} {t("order.orders", "orders")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SheetTitle className="text-lg font-semibold mr-7">
              {t("order.dispenser_history", "Dispenser Order History")}
              {dispenserId != null && (
                <span className="text-sm text-muted-foreground ml-2">
                  #{dispenserId}
                </span>
              )}
            </SheetTitle>
          </div>
        </SheetHeader>
        {/* Limit select moved to header, replaced with shadcn Select */}
        <div
          className="flex-1 p-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="animate-spin h-8 w-8 mb-2 text-muted-foreground" />
              <span className="text-muted-foreground">
                {t("order.loading_history", "Loading order history...")}
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
              <AlertCircle className="h-8 w-8 mb-2" />
              <span>{error}</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <span>
                {t(
                  "order.no_history",
                  "No order history found for this dispenser."
                )}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {orders.map(order => (
                <OrderHistoryCheque key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Cheque-like block for order history (no header/footer)
import { useLayoutEffect, useRef } from "react";

function OrderHistoryCheque({ order }: { order: OrderEntity }) {
  const items = order.items || [];
  const subtotal = items.reduce(
    (sum, item) => sum + item.count * item.price,
    0
  );
  const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
  const totalTax = items.reduce((sum, item) => sum + item.tax, 0);

  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [foldable, setFoldable] = useState(false);

  useLayoutEffect(() => {
    if (contentRef.current) {
      setFoldable(contentRef.current.scrollHeight > 320); // 20rem = 320px
    }
  }, [order]);

  return (
    <div
      className="bg-white border rounded shadow-sm p-4 w-full max-w-xs font-mono text-xs mx-auto relative"
      style={{ minWidth: 240, maxWidth: 320 }}
    >
      <div
        ref={contentRef}
        style={{
          maxHeight: expanded ? undefined : "20rem",
          overflowY: foldable && !expanded ? "auto" : "visible",
          transition: "max-height 0.1s",
        }}
      >
        {/* Order Info */}
        <div className="flex justify-between text-[11px] mb-1">
          <span>
            {t("order.cheque_number", "Cheque No")}: {getStrId(order.id ?? "")}
          </span>
          <span>{formatStringDate(order.d_created)}</span>
        </div>
        <div className="border-b border-dashed my-1" />

        {/* Items */}
        {items.map((item, idx) => (
          <div key={item.id || idx} className="mb-1">
            <div className="flex items-start gap-2">
              <div className="w-5 flex-shrink-0 text-right">{idx + 1}.</div>
              <div className="min-w-0 flex-1">
                <div className="break-words">
                  {item.product?.name || t("product.unknown")}
                </div>
                <div>
                  {item.count} {item.product?.unit?.short_name || ""} x{" "}
                  {item.price.toLocaleString()} ={" "}
                  {(item.count * item.price).toLocaleString()} {t("currency.sum")}
                </div>
                {item.tax > 0 && (
                  <div className="text-blue-700">
                    {t("order.total_tax", "Tax")}: {item.tax.toLocaleString()} {t("currency.sum")}
                  </div>
                )}
              </div>
            </div>
            {item.discounts && item.discounts.length > 0 && (
              <div className="text-green-700">
                {item.discounts.map((d, i) => (
                  <span key={i}>
                    {d.name}: -{d.value.toLocaleString()} {t("currency.sum")}
                    {i < item.discounts.length - 1 ? "  " : ""}
                  </span>
                ))}
              </div>
            )}
            {item.taxes && item.taxes.length > 0 && (
              <div className="text-blue-700">
                {item.taxes.map((tax, i) => (
                  <span key={i}>
                    {tax.name}: {tax.value.toLocaleString()}{" "}
                    {t("currency.sum")}
                    {i < item.taxes.length - 1 ? "  " : ""}
                  </span>
                ))}
              </div>
            )}
            <div className="text-right font-bold">
              {t("order_item.cost")}: {item.cost.toLocaleString()}{" "}
              {t("currency.sum")}
            </div>
            <div className="border-b border-dashed my-1" />
          </div>
        ))}

        {/* Totals */}
        <div className="text-right">
          {t("order.subtotal")}: {subtotal.toLocaleString()} {t("currency.sum")}
        </div>
        {totalDiscount > 0 && (
          <div className="text-right text-green-700">
            {t("order.total_discount")}: -{totalDiscount.toLocaleString()}{" "}
            {t("currency.sum")}
          </div>
        )}
        {totalTax > 0 && (
          <div className="text-right text-blue-700">
            {t("order.total_tax")}: +{totalTax.toLocaleString()}{" "}
            {t("currency.sum")}
          </div>
        )}
        <div className="border-b border-dashed my-1" />
        <div className="text-right font-bold text-base">
          {t("order.total")}: {order.summ.toLocaleString()} {t("currency.sum")}
        </div>
        {order.d_move && (
          <div className="text-right text-[10px]">
            {t("order.d_move")}: {formatStringDate(order.d_move)}
          </div>
        )}
        {order.discard && (
          <div className="text-right text-[10px] text-destructive">
            {t("order.discard")}: {order.discard}
          </div>
        )}
      </div>
      {foldable && (
        <div className="absolute left-0 right-0 bottom-0 flex justify-center bg-gradient-to-t from-white/90 to-transparent pt-4 pb-2">
          <button
            className="px-2 py-1 text-xs rounded border bg-muted hover:bg-muted/70 transition"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded
              ? t("order.fold_cheque", "Show less")
              : t("order.expand_cheque", "Show more")}
          </button>
        </div>
      )}
    </div>
  );
}
