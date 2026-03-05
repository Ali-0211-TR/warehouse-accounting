import { lazy } from "react";

const ReconciliationReportPage = lazy(() =>
  import("../ui/ReconciliationReportPage").then((m) => ({
    default: m.ReconciliationReportPage,
  })),
);

export const reconciliationReportPageRoute = {
  path: "/reconciliation/",
  element: <ReconciliationReportPage />,
};
