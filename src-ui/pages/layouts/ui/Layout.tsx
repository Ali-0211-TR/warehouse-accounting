import { useOrderStore } from "@/entities/order";
import { useSettingsState } from "@/entities/settings";
import { SidebarInset, SidebarProvider } from "@/shared/ui/shadcn/sidebar";
import { ManageSalerOrdersSheet } from "@/widgets/manage-active-orders";
import { AppSidebar } from "@/widgets/sidebars/app-sidebar";
import { SiteHeader } from "@/widgets/sidebars/site-header";
import { Suspense } from "react";
import { Outlet } from "react-router-dom";

function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export function GenericLayout() {
  const isOrdersSheetOpen = useOrderStore((s) => s.isOrdersSheetOpen);
  const ordersSheetActiveOrderId = useOrderStore((s) => s.ordersSheetActiveOrderId);
  const closeOrdersSheet = useOrderStore((s) => s.closeOrdersSheet);
  const { data } = useSettingsState();
  const isWarehouse = (data.appMode ?? "fuel") === "warehouse";

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col m-0 p-0">
          <div className="@container/main flex flex-1 flex-col p-0">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </SidebarInset>

      {!isWarehouse && (
        <ManageSalerOrdersSheet
          open={isOrdersSheetOpen}
          onOpenChange={closeOrdersSheet}
          activeOrderId={ordersSheetActiveOrderId}
        />
      )}
    </SidebarProvider>
  );
}

export function GuestLayout() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Outlet />
    </Suspense>
  );
}

export function NakedLayout() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Outlet />
    </Suspense>
  );
}
