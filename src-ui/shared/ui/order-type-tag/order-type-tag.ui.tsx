import { OrderType } from "../../bindings/OrderType";
import { t } from "i18next";
import { Badge } from "@/shared/ui/shadcn/badge";

export function OrderTypeTag(orderType: OrderType) {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    switch (orderType) {
        case "Income":
            variant = "default";
            break;
        case "Outcome":
            variant = "destructive";
            break;
        case "Sale":
            variant = "secondary";
            break;
        case "Returns":
            variant = "destructive";
            break;
        default:
            variant = "default";
    }

    return (
        <Badge variant={variant}>
            {t("lists.order_type." + orderType)}
        </Badge>
    );
}
