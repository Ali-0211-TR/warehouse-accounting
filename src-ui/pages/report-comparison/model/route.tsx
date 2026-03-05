import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const ComparisonReportPage = lazy(() =>
  import("../ui/ComparisonReportPage").then((m) => ({
    default: m.ComparisonReportPage,
  })),
);

export const comparisonReportPageRoute = {
  path: pathKeys.comparison(),
  element: <ComparisonReportPage />,
};
