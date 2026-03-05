import { BrowserRouter } from "./RouterProvider.tsx";
import { withSuspense } from "../../shared/lib/react/index.ts";
import { withErrorBoundary } from "react-error-boundary";
import { useEffect } from "react";
import { eventListener } from "./TauriEventProvider.ts";
import { Loader } from "@/shared/ui/loader/loader.ui.tsx";
import { FullPageError } from "@/shared/ui/full-page-error/index.ts";
import { useSettingsInit } from "@/entities/settings";
import { useProductStore } from "@/entities/product";




function Providers() {
  // Initialize settings on app start
  useSettingsInit();

  // Load products globally on app start so they're always available in the store
  useEffect(() => {
    useProductStore.getState().loadProducts().catch(console.error);
  }, []);

  useEffect(() => {
    const unlisten = eventListener();
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <>
      <BrowserRouter />
    </>
  );
}

const SuspensedProvider = withSuspense(Providers, {
  fallback: <Loader size="full" />,
});

export const Provider = withErrorBoundary(SuspensedProvider, {
  fallbackRender: ({ error }) => <FullPageError error={error} />,
});
