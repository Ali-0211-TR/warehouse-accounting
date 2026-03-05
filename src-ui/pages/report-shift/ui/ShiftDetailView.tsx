import type { ShiftDetailData } from "../model/use-shift-detail";
import { formatAmount } from "@/shared/lib/format-amount";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/shadcn/card";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
  ArrowLeft,
  Banknote,
  Clock,
  Fuel,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Undo2,
  User,
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { useTranslation } from "react-i18next";

interface ShiftDetailViewProps {
  data: ShiftDetailData;
  onBack: () => void;
}

export function ShiftDetailView({ data, onBack }: ShiftDetailViewProps) {
  const { t } = useTranslation();
  const { shift, orders } = data;
  const meta = orders.meta;
  const totals = meta.totalsByType;

  const dOpen = new Date(shift.d_open);
  const dClose = shift.d_close ? new Date(shift.d_close) : null;
  const durationMin = dClose ? differenceInMinutes(dClose, dOpen) : differenceInMinutes(new Date(), dOpen);
  const hours = Math.floor(durationMin / 60);
  const mins = durationMin % 60;

  const fmtAmount = (v: number) => formatAmount(v);

  return (
    <div className="space-y-4">
      {/* Back button + header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("control.back", "Назад")}
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            {t("shift.detail_title", "Отчёт за смену")}
            <Badge variant={dClose ? "secondary" : "default"} className="ml-2">
              {dClose ? t("shift.closed", "Закрыта") : t("shift.open", "Открыта")}
            </Badge>
          </h2>
        </div>
      </div>

      {/* Shift info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-xs text-muted-foreground mb-1">{t("shift.operator", "Оператор")}</div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-sm">{shift.user_open?.full_name || shift.user_open?.username || "—"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-xs text-muted-foreground mb-1">{t("shift.opened_at", "Открыта")}</div>
            <div className="font-mono text-sm">{format(dOpen, "dd.MM.yyyy HH:mm")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-xs text-muted-foreground mb-1">{t("shift.closed_at", "Закрыта")}</div>
            <div className="font-mono text-sm">
              {dClose ? format(dClose, "dd.MM.yyyy HH:mm") : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-xs text-muted-foreground mb-1">{t("shift.duration", "Длительность")}</div>
            <div className="font-mono text-sm">{hours}ч {mins}мин</div>
          </CardContent>
        </Card>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              {t("report.total_incoming", "Доход")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-green-600 font-mono">{fmtAmount(meta.totalIncoming)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {t("report.orders_count", "Ордеров")}: {orders.count}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <TrendingDown className="h-4 w-4" />
              {t("report.total_outgoing", "Расход")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-red-600 font-mono">{fmtAmount(meta.totalOutgoing)}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
              <Banknote className="h-4 w-4" />
              {t("report.net_flow", "Чистый результат")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={`text-2xl font-bold font-mono ${meta.totalSum >= 0 ? "text-green-600" : "text-red-600"}`}>
              {fmtAmount(meta.totalSum)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type breakdown */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">{t("report.breakdown_by_type", "Разбивка по типам операций")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Income */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Package className="h-3.5 w-3.5 text-emerald-500" />
                {t("order.type.income", "Приход")}
              </div>
              <div className="text-lg font-bold font-mono text-emerald-600">{fmtAmount(totals.incomeSum)}</div>
              <div className="text-xs text-muted-foreground">
                {t("order.tax", "Налог")}: {fmtAmount(totals.incomeTax)}
              </div>
            </div>

            {/* Sale */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <ShoppingCart className="h-3.5 w-3.5 text-blue-500" />
                {t("order.type.sale", "Продажа")}
              </div>
              <div className="text-lg font-bold font-mono text-blue-600">{fmtAmount(totals.saleSum)}</div>
              <div className="text-xs text-muted-foreground">
                {t("order.tax", "Налог")}: {fmtAmount(totals.saleTax)}
              </div>
            </div>

            {/* Outcome */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                {t("order.type.outcome", "Расход")}
              </div>
              <div className="text-lg font-bold font-mono text-red-600">{fmtAmount(totals.outcomeSum)}</div>
              <div className="text-xs text-muted-foreground">
                {t("order.tax", "Налог")}: {fmtAmount(totals.outcomeTax)}
              </div>
            </div>

            {/* Returns */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Undo2 className="h-3.5 w-3.5 text-yellow-500" />
                {t("order.type.returns", "Возврат")}
              </div>
              <div className="text-lg font-bold font-mono text-yellow-600">{fmtAmount(totals.returnsSum)}</div>
              <div className="text-xs text-muted-foreground">
                {t("order.tax", "Налог")}: {fmtAmount(totals.returnsTax)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tank data from shift open/close */}
      {shift.data_open && shift.data_open.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Fuel className="h-4 w-4 text-blue-500" />
              {t("shift.tank_data", "Данные ёмкостей")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-3">№</th>
                    <th className="text-left py-2 pr-3">{t("shift.fuel_type", "Топливо")}</th>
                    <th className="text-right py-2 pr-3">{t("shift.volume_open", "Объём (откр)")}</th>
                    <th className="text-right py-2 pr-3">{t("shift.volume_close", "Объём (закр)")}</th>
                    <th className="text-right py-2 pr-3">{t("shift.difference", "Разница")}</th>
                    <th className="text-right py-2 pr-3">{t("shift.level", "Уровень")}</th>
                    <th className="text-right py-2">{t("shift.temperature", "Темп.")}</th>
                  </tr>
                </thead>
                <tbody>
                  {shift.data_open.map((tankOpen, i) => {
                    const tankClose = shift.data_close?.[i];
                    const volDiff = tankClose
                      ? (tankClose.volume_current - tankOpen.volume_current)
                      : null;
                    return (
                      <tr key={tankOpen.number} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-mono">{tankOpen.number}</td>
                        <td className="py-2 pr-3">{tankOpen.gas}</td>
                        <td className="py-2 pr-3 text-right font-mono">{tankOpen.volume_current.toFixed(2)}</td>
                        <td className="py-2 pr-3 text-right font-mono">
                          {tankClose ? tankClose.volume_current.toFixed(2) : "—"}
                        </td>
                        <td className={`py-2 pr-3 text-right font-mono ${volDiff !== null && volDiff < 0 ? "text-red-500" : "text-green-500"}`}>
                          {volDiff !== null ? volDiff.toFixed(2) : "—"}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono">{tankOpen.level_current.toFixed(2)}</td>
                        <td className="py-2 text-right font-mono">{tankOpen.temperature.toFixed(1)}°</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispenser data from shift */}
      {shift.data_open?.some(d => d.dispensers_data && d.dispensers_data.length > 0) && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Fuel className="h-4 w-4 text-orange-500" />
              {t("shift.dispenser_data", "Данные ТРК")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-3">{t("shift.dispenser", "ТРК")}</th>
                    <th className="text-right py-2 pr-3">{t("shift.nozzle", "Пистолет")}</th>
                    <th className="text-right py-2 pr-3">{t("shift.shift_volume", "Объём за смену")}</th>
                    <th className="text-right py-2 pr-3">{t("shift.shift_amount", "Сумма за смену")}</th>
                    <th className="text-right py-2 pr-3">{t("shift.total_volume", "Общий объём")}</th>
                    <th className="text-right py-2">{t("shift.total_amount", "Общая сумма")}</th>
                  </tr>
                </thead>
                <tbody>
                  {shift.data_open.flatMap((tank) =>
                    (tank.dispensers_data || []).map((dd) => (
                      <tr key={`${tank.number}-${dd.nozzle_addres}`} className="border-b last:border-0">
                        <td className="py-2 pr-3">{dd.dispenser_name}</td>
                        <td className="py-2 pr-3 text-right font-mono">{dd.nozzle_addres}</td>
                        <td className="py-2 pr-3 text-right font-mono">{dd.shift_volume.toFixed(2)}</td>
                        <td className="py-2 pr-3 text-right font-mono">{fmtAmount(dd.shift_amount)}</td>
                        <td className="py-2 pr-3 text-right font-mono">{dd.total_volume.toFixed(2)}</td>
                        <td className="py-2 text-right font-mono">{fmtAmount(dd.total_amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders list */}
      {orders.items.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              {t("shift.orders_list", "Ордеры за смену")} ({orders.count})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-3">{t("order.id", "№")}</th>
                    <th className="text-left py-2 pr-3">{t("order.type_label", "Тип")}</th>
                    <th className="text-left py-2 pr-3">{t("order.client", "Клиент")}</th>
                    <th className="text-right py-2 pr-3">{t("order.summ", "Сумма")}</th>
                    <th className="text-right py-2 pr-3">{t("order.tax", "Налог")}</th>
                    <th className="text-left py-2">{t("order.d_move", "Дата")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.items.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{order.id?.slice(-6) || "—"}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline" className="text-xs">
                          {t(`order.type.${(order.order_type || "").toLowerCase()}`, order.order_type || "")}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 text-xs">{order.client?.name || "—"}</td>
                      <td className="py-2 pr-3 text-right font-mono">{fmtAmount(order.summ || 0)}</td>
                      <td className="py-2 pr-3 text-right font-mono">{fmtAmount(order.tax || 0)}</td>
                      <td className="py-2 text-xs">
                        {order.d_move ? format(new Date(order.d_move), "dd.MM HH:mm") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
