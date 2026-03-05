import { lazy } from "react";
import { pathKeys } from "@/shared/lib/react-router";

const MovementsReportPage = lazy(() =>
    import("../ui/MovementsReportPage").then((module) => ({
        default: module.MovementsReportPage,
    }))
);

export const movementsReportPageRoute = {
    path: pathKeys.movements_report(),
    element: <MovementsReportPage />,
};
