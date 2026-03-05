import { useOrderStore } from "@/entities/order";
import { useProductStore } from "@/entities/product";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/shadcn/card";
import { Button } from "@/shared/ui/shadcn/button";
import { pathKeys } from "@/shared/lib/react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Package,
  RotateCcw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { memo, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export const HomePage = memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const products = useProductStore((s) => s.products);
  const activeOrders = useOrderStore((s) => s.activeOrders);
  const loadActiveOrders = useOrderStore((s) => s.loadActiveOrders);

  useEffect(() => {
    loadActiveOrders().catch(console.error);
  }, [loadActiveOrders]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(
      (p) => p.balance !== undefined && p.balance !== null && Number(p.balance) <= 5 && Number(p.balance) > 0
    ).length;
    const outOfStockProducts = products.filter(
      (p) => p.balance !== undefined && p.balance !== null && Number(p.balance) <= 0
    ).length;

    const pendingSales = activeOrders.filter(
      (o) => o.order_type === "Sale" && !o.d_move
    ).length;
    const pendingIncome = activeOrders.filter(
      (o) => o.order_type === "Income" && !o.d_move
    ).length;
    const pendingOutcome = activeOrders.filter(
      (o) => o.order_type === "Outcome" && !o.d_move
    ).length;
    const pendingReturns = activeOrders.filter(
      (o) => o.order_type === "Returns" && !o.d_move
    ).length;

    const totalInventoryValue = products.reduce((sum, p) => {
      const balance = Number(p.balance || 0);
      const price = Number(p.sale_price || 0);
      return sum + balance * price;
    }, 0);

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      pendingSales,
      pendingIncome,
      pendingOutcome,
      pendingReturns,
      totalInventoryValue,
    };
  }, [products, activeOrders]);

  const quickActions = [
    {
      title: t("menu.operations.sales", "Продажа"),
      icon: ShoppingCart,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950",
      onClick: () => navigate(pathKeys.sales()),
    },
    {
      title: t("menu.operations.income", "Поступление"),
      icon: ArrowDownCircle,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950",
      onClick: () => navigate(pathKeys.income()),
    },
    {
      title: t("menu.operations.outcome", "Расход"),
      icon: ArrowUpCircle,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950",
      onClick: () => navigate(pathKeys.outcome()),
    },
    {
      title: t("menu.operations.returns", "Возврат"),
      icon: RotateCcw,
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-950",
      onClick: () => navigate(pathKeys.returns()),
    },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <Warehouse className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">
            {t("dashboard.title", "Панель управления")}
          </h1>
          <p className="text-muted-foreground">
            {t("dashboard.subtitle", "Складской учёт и управление товарами")}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.total_products", "Всего товаров")}
              </p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.inventory_value", "Стоимость склада")}
              </p>
              <p className="text-2xl font-bold">
                {stats.totalInventoryValue.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.low_stock", "Мало на складе")}
              </p>
              <p className="text-2xl font-bold">{stats.lowStockProducts}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.out_of_stock", "Нет в наличии")}
              </p>
              <p className="text-2xl font-bold">{stats.outOfStockProducts}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          {t("dashboard.quick_actions", "Быстрые действия")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className={`cursor-pointer hover:shadow-md transition-shadow ${action.bg}`}
              onClick={action.onClick}
            >
              <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                <action.icon className={`h-10 w-10 ${action.color}`} />
                <span className="font-medium">{action.title}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pending operations */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          {t("dashboard.pending_operations", "Незавершённые операции")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(pathKeys.sales())}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.pending_sales", "Продажи")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.pendingSales}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(pathKeys.income())}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.pending_income", "Поступления")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{stats.pendingIncome}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(pathKeys.outcome())}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.pending_outcome", "Расходы")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-orange-500" />
                <span className="text-2xl font-bold">{stats.pendingOutcome}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(pathKeys.returns())}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.pending_returns", "Возвраты")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{stats.pendingReturns}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reports shortcut */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          {t("dashboard.reports", "Отчёты")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(pathKeys.summary())}
          >
            <BarChart3 className="h-6 w-6" />
            <span>{t("menu.report.summary", "Сводный отчёт")}</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(pathKeys.product_report())}
          >
            <Package className="h-6 w-6" />
            <span>{t("menu.report.product_report", "Остатки товаров")}</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(pathKeys.movements_report())}
          >
            <TrendingUp className="h-6 w-6" />
            <span>{t("menu.report.product_movements", "Движение товаров")}</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(pathKeys.shift_report())}
          >
            <BarChart3 className="h-6 w-6" />
            <span>{t("menu.report.shift_report", "Отчёт по сменам")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
});
