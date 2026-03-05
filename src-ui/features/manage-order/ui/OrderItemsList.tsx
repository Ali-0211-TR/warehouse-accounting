import React, {  useCallback, useMemo, useState } from "react";
import { t } from "i18next";
import { Minus, Trash } from "lucide-react";

import { useOrderStore } from "@/entities/order";
import { OrderItemEntity } from "@/shared/bindings/OrderItemEntity";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import { Separator } from "@/shared/ui/shadcn/separator";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Label } from "@/shared/ui/shadcn/label";

// ✅ используем твой NumericInput вместо обычного input
import { NumericInput } from "@/shared/ui/NumericInput";

type OrderItemsListProps = {
  items: OrderItemEntity[];
  isEditable?: boolean;
  className?: string;
};

export const OrderItemsList = React.memo(function OrderItemsList({
  items,
  isEditable = false,
  className = "",
}: OrderItemsListProps) {
  const removeOrderItem = useOrderStore((s) => s.removeOrderItem);
  const addOrderItem = useOrderStore((s) => s.addOrderItem);

  // ---------- EDIT MODAL STATE ----------
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItemEntity | null>(null);
  const [editCount, setEditCount] = useState<number>(0);

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeOrderItem(itemId);
    } catch (error) {
      console.error("Failed to remove order item:", error);
    }
  };

  const handleDecrementItem = async (orderItem: OrderItemEntity) => {
    if (orderItem.count <= 1) {
      if (orderItem.id != null) {
        await removeOrderItem(orderItem.id);
      }
      return;
    }
    try {
      await addOrderItem({
        ...orderItem,
        count: -1,
        product_id: orderItem.product?.id || "",
      });
    } catch (error) {
      console.error("Failed to remove order item:", error);
    }
  };

  // Determine if an item can be edited
  // All items can be edited in warehouse mode
  const canEditItem = useCallback(
    (_item: OrderItemEntity): boolean => {
      return true;
    },
    []
  );

  const openEditModal = useCallback(
    (item: OrderItemEntity) => {
      if (!isEditable) return;
      if (!canEditItem(item)) return;

      setEditingItem(item);
      setEditCount(Number(item.count ?? 0));
      setEditOpen(true);
    },
    [isEditable, canEditItem]
  );

  const closeEditModal = useCallback(() => {
    setEditOpen(false);
    setEditingItem(null);
    setEditCount(0);
  }, []);

  const normalizedEditCount = useMemo(() => Math.trunc(editCount || 0), [editCount]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingItem) return;

    const newCount = Math.trunc(editCount || 0);

    // 0 или меньше — удаляем позицию
    if (newCount <= 0) {
      if (editingItem.id) await removeOrderItem(editingItem.id);
      closeEditModal();
      return;
    }

    const oldCount = editingItem.count ?? 0;
    const delta = newCount - oldCount;

    // ничего не изменилось
    if (delta === 0) {
      closeEditModal();
      return;
    }

    try {
      // ВАЖНО: addOrderItem у тебя работает как "изменение количества" (как в count:-1)
      await addOrderItem({
        ...editingItem,
        count: delta,
        product_id: editingItem.product?.id || "",
      });
      closeEditModal();
    } catch (error) {
      console.error("Failed to update order item count:", error);
    }
  }, [editingItem, editCount, addOrderItem, removeOrderItem, closeEditModal]);

  if (items.length === 0) {
    return (
      <div className={`text-center text-muted-foreground py-8 ${className}`}>
        <div className="text-sm">{t("order.no_items")}</div>
      </div>
    );
  }

  return (
    <>
      <div className={`${className}`}>
        <Separator />

        {items.map((item, index) => (
          <div key={item.id || index}>
            <div
              role={isEditable && canEditItem(item) ? "button" : undefined}
              tabIndex={isEditable && canEditItem(item) ? 0 : undefined}
              onClick={() => openEditModal(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openEditModal(item);
              }}
              className="
                flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3
                py-2 hover:bg-muted/50 rounded-md transition-colors
              "
            >
              {/* Left number column */}
              <div className="w-7 flex-shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground pt-0.5">
                {index + 1}.
              </div>

              {/* Content column */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 min-w-0">
                  <span className="font-medium break-words whitespace-normal">
                    {item.product?.name || t("product.unknown")}
                  </span>

                  {item.product?.bar_code && (
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {item.product.bar_code}
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  {/* Price line */}
                  <div className="flex flex-col gap-1">
                    <span>
                      <strong>
                        {item.count} {item.product?.unit?.short_name}{" "}
                        {item.price} = {(item.count * item.price).toLocaleString()}{" "}
                        {t("currency.sum")}
                      </strong>
                    </span>

                    {/* Tax is shown as a separate amount (not added to the item total) */}
                    {item.tax > 0 && (
                      <span className="text-blue-700">
                        {t("product.tax", t("order_item.tax", "Tax"))}:{" "}
                        <strong>
                          {item.tax.toLocaleString()} {t("currency.sum")}
                        </strong>
                      </span>
                    )}

                    {item.discount > 0 && (
                      <span className="text-green-700">
                        {t("product.discount")}:{" "}
                        <strong>
                          {item.discount.toLocaleString()} {t("currency.sum")}
                        </strong>
                      </span>
                    )}
                  </div>

                  {/* Display detailed discounts */}
                  {item.discounts && item.discounts.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-muted-foreground">
                        {t("product.discounts")}:
                      </span>
                      {item.discounts.map((discount, discountIndex) => (
                        <Badge
                          key={discountIndex}
                          variant="secondary"
                          className="text-xs bg-green-100 text-green-800"
                        >
                          {discount.name}: -{discount.value} {t("currency.sum")}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Display detailed taxes */}
                  {item.taxes && item.taxes.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.taxes.map((tax, taxIndex) => (
                        <Badge
                          key={taxIndex}
                          variant="secondary"
                          className="text-xs bg-blue-100 text-blue-800"
                        >
                          {tax.name}: {tax.value.toLocaleString()} {t("currency.sum")}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <span>
                      {t("order.base_amount")}:{" "}
                      <strong>
                        {item.cost.toLocaleString()} {t("currency.sum")}
                      </strong>
                    </span>
                  </div>

                  {isEditable && canEditItem(item) && (
                    <div className="text-xs text-muted-foreground/80 mt-1">
                      {t("order_item.tap_to_edit", "Нажмите, чтобы изменить количество")}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {isEditable && canEditItem(item) && (
                <div
                  className="
                    flex gap-2
                    sm:flex-col sm:items-center sm:ml-3
                    mt-2 sm:mt-0
                  "
                  onClick={(e) => e.stopPropagation()} // ✅ кнопки не открывают модалку
                >
                  <Button
                    size="sm"
                    onClick={() => item.id && handleRemoveItem(item.id)}
                    variant="ghost"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => item.id && handleDecrementItem(item)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {index < items.length && <Separator />}
          </div>
        ))}
      </div>

      {/* ---------- EDIT MODAL ---------- */}
      <Dialog
        open={editOpen}
        onOpenChange={(v) => (v ? setEditOpen(true) : closeEditModal())}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("order_item.edit_quantity", "Изменить количество")}
            </DialogTitle>
            <DialogDescription className="break-words">
              {editingItem?.product?.name || t("product.unknown")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="edit-count">{t("order_item.quantity", "Количество")}</Label>

            {/* ✅ NumericInput с нумпадом */}
            <NumericInput
              value={editCount}
              onChange={(v) => setEditCount(v)}
              onEnterPress={handleSaveEdit}
              placeholder={t("order_item.enter_quantity", "Введите количество")}
              showNumpadButton
              className="w-full"
            />

            {normalizedEditCount <= 0 && (
              <div className="text-xs text-muted-foreground">
                {t("order_item.zero_will_remove", "0 или меньше — товар будет удалён")}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={closeEditModal}>
              {t("buttons.cancel", "Отмена")}
            </Button>
            <Button onClick={handleSaveEdit}>{t("buttons.save", "Сохранить")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
