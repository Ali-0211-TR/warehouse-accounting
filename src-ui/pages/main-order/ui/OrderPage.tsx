import React from "react";
import { OrderManagement } from "@/widgets/order";
import { ErrorBoundary } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/shadcn/button";

// Error fallback component
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
        {t("error.order_page_error", "Something went wrong with orders")}
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

export const OrderPage = React.memo(() => {
  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          // Reset any global state if needed
          window.location.reload();
        }}
      >
        <OrderManagement />
      </ErrorBoundary>
    </div>
  );
});

OrderPage.displayName = "OrderPage";
