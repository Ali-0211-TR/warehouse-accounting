
import { useOrderStore } from "@/entities/order";
import { useShiftStore } from "@/entities/shift";
import { Button } from "@/shared/ui/shadcn/button";
import { Separator } from "@/shared/ui/shadcn/separator";
import { SidebarTrigger } from "@/shared/ui/shadcn/sidebar";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { t } from "i18next";
import { pathKeys } from "@/shared/lib/react-router";
import { useSettingsState } from "@/entities/settings";
import { WarehouseOrdersDialog } from "@/widgets/warehouse-orders-dialog";

export function SiteHeader() {
    const openOrdersSheet = useOrderStore((s) => s.openOrdersSheet);
    const isWarehouseOrdersDialogOpen = useOrderStore((s) => s.isWarehouseOrdersDialogOpen);
    const openWarehouseOrdersDialog = useOrderStore((s) => s.openWarehouseOrdersDialog);
    const closeWarehouseOrdersDialog = useOrderStore((s) => s.closeWarehouseOrdersDialog);
    const { currentShift, getCurrentShift } = useShiftStore();
    const navigate = useNavigate();
    const { data } = useSettingsState();
    const isWarehouse = (data.appMode ?? "fuel") === "warehouse";

    // Load current shift on component mount
    useEffect(() => {
        getCurrentShift();
    }, [getCurrentShift]);

    const handleShiftClick = () => {
        navigate(pathKeys.shift());
    };

    const getShiftButtonText = () => {
        if (!currentShift) {
            return t('shift.no_active_shift');
        }
        return `${t('shift.current_shift')}: ${currentShift.user_open?.full_name || t('shift.unknown_user')}`;
        // return `${t('shift.current_shift')}: ${currentShift.user_open?.full_name || t('shift.unknown_user')}  ( ${currentShift.d_open ? new Date(currentShift.d_open).toLocaleTimeString() : t('shift.not_started')}${currentShift.d_close ? ` - ${new Date(currentShift.d_close).toLocaleTimeString()}` : ''})`;
    };

    const getShiftStatus = () => {
        if (!currentShift) {
            return 'closed';
        }
        return currentShift.d_close ? 'closed' : 'open';
    };

    return (
        <>
            <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
                <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mx-2 data-[orientation=vertical]:h-4"
                    />

                    {/* Shift Status Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShiftClick}
                        className="text-base font-medium hover:bg-muted/50 px-2"
                    >
                        {/* <Clock className="h-4 w-4 mr-2" /> */}
                        <span className={`${getShiftStatus() === 'open' ? 'text-green-600' : 'text-red-600'}`}>
                            {getShiftButtonText()}
                        </span>
                    </Button>

                    <div className="ml-auto flex items-center gap-2">
                        <Button
                            variant="default"
                            size="icon"
                            onClick={() => (isWarehouse ? openWarehouseOrdersDialog() : openOrdersSheet())}
                            title={t('order.open_active_orders')}
                        >
                            <ShoppingCart />
                        </Button>
                    </div>
                </div>
            </header>

            {isWarehouse && (
                <WarehouseOrdersDialog
                    open={isWarehouseOrdersDialogOpen}
                    onOpenChange={(open) =>
                        open ? openWarehouseOrdersDialog() : closeWarehouseOrdersDialog()
                    }
                />
            )}
        </>
    )
}
