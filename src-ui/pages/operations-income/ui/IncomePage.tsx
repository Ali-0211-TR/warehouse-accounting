import { OrderManagement } from "@/widgets/order";
import { useOrderStore } from "@/entities/order";
import React, { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/shadcn/button";

const ErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        {t("error.page_error", "Something went wrong")}
      </h2>
      <p className="text-sm text-gray-600 mb-4 max-w-md">
        {error.message ||
          t("error.unexpected_error", "An unexpected error occurred")}
      </p>
      <Button
        onClick={resetErrorBoundary}
        variant="outline"
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        {t("control.retry", "Try again")}
      </Button>
    </div>
  );
};

export const IncomePage = React.memo(() => {
  const setFilters = useOrderStore((s) => s.setFilters);

  useEffect(() => {
    setFilters({ order_type: "Income" });
  }, [setFilters]);

  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          window.location.reload();
        }}
      >
        <OrderManagement />
      </ErrorBoundary>
    </div>
  );
});
IncomePage.displayName = "IncomePage";
