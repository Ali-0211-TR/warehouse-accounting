import { ReportLayout } from "@/shared/ui/components/ReportLayout";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/shadcn/button";
import { Filter, Fuel, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useFuelMovementsData } from "../model/use-fuel-movements-data";
import { FuelMovementsSummaryCards } from "./FuelMovementsSummaryCards";
import { FuelMovementsTankSummary } from "./FuelMovementsTankSummary";
import { FuelMovementsNozzleTable } from "./FuelMovementsNozzleTable";
import { FuelMovementsFilterDialog } from "./FuelMovementsFilterDialog";
import { FuelMovementsDataActions } from "./FuelMovementsDataActions";

export function FuelMovementsReportPage() {
  const { t } = useTranslation();
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const {
    // State
    movements,
    filteredMovements,
    isLoading,
    isLoadingSummary,
    isInitialLoading,
    lastRefreshTime,

    // Derived
    summaryStats,
    tankGroupedData,
    uniqueDispensers,
    uniqueTanks,
    hasActiveFilters,

    // Shift
    currentShift,
    shifts,

    // Form / date filter
    form,
    dateFilter,

    // Formatters
    formatVolume,
    formatDecimal,
    formatCurrency,

    // Actions
    readAllTotals,
    clearAllFilters,
    onSubmitFilters,
    handleHeaderShiftSelect,
  } = useFuelMovementsData();

  // ─── Loading screen ──────────────────────────────────────
  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
        <span className="ml-2 text-lg text-slate-200">{t("control.loading")}</span>
      </div>
    );
  }

  // ─── Header actions ──────────────────────────────────────
  const headerActions = (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={() => readAllTotals()}
        disabled={isLoading}
        title={t("control.refresh")}
      >
        <RefreshCw className={cn("h-4 w-4 mr-0 sm:mr-2", isLoading && "animate-spin")} />
        <span className="hidden sm:inline">{t("control.refresh")}</span>
      </Button>

      <FuelMovementsDataActions
        data={filteredMovements}
        disabled={filteredMovements.length === 0}
        formatVolume={formatVolume}
        formatCurrency={formatCurrency}
      />

      <Button
        size="sm"
        variant="outline"
        onClick={() => setFilterDialogOpen(true)}
        className={cn(
          hasActiveFilters ? "hover:bg-yellow-700" : "text-black-800 hover:bg-yellow-200",
          "font-semibold",
        )}
        title={t("fuel_movements.filters")}
      >
        <Filter className="h-4 w-4 mr-0 sm:mr-2" />
        <span className="hidden sm:inline">{t("fuel_movements.filters")}</span>
      </Button>
    </div>
  );

  return (
    <ReportLayout
      title="menu.report.fuel_movements"
      icon={<Fuel className="h-6 w-6 text-blue-300" />}
      showShiftSelector
      selectedShift={currentShift}
      onShiftSelect={handleHeaderShiftSelect}
      headerActions={headerActions}
    >
      {/* Summary Cards */}
      <FuelMovementsSummaryCards
        stats={summaryStats}
        uniqueTanksCount={uniqueTanks.length}
        nozzleCount={movements.length}
        lastRefreshTime={lastRefreshTime}
        formatCurrency={formatCurrency}
      />

      {/* Tank Summary */}
      <FuelMovementsTankSummary
        data={tankGroupedData}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        formatVolume={formatVolume}
        formatDecimal={formatDecimal}
        formatCurrency={formatCurrency}
      />

      {/* Nozzle Data Table */}
      <FuelMovementsNozzleTable
        data={filteredMovements}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        formatVolume={formatVolume}
        formatDecimal={formatDecimal}
        formatCurrency={formatCurrency}
      />

      {/* Filter Dialog */}
      <FuelMovementsFilterDialog
        open={filterDialogOpen}
        onOpenChange={(open) => {
          setFilterDialogOpen(open);
        }}
        form={form}
        dateFilter={dateFilter}
        shifts={shifts}
        uniqueDispensers={uniqueDispensers}
        uniqueTanks={uniqueTanks}
        isLoadingSummary={isLoadingSummary}
        hasActiveFilters={hasActiveFilters}
        onSubmit={(values) => {
          onSubmitFilters(values);
          setFilterDialogOpen(false);
        }}
        onClear={clearAllFilters}
      />
    </ReportLayout>
  );
}
