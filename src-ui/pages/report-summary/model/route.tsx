import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const SummaryReportPage = lazy(() =>
  import("../ui/SummaryReportPage").then(module => ({
    default: module.SummaryReportPage,
  }))
);

export const summaryReportPageRoute = {
  path: pathKeys.summary(),
  element: <SummaryReportPage />,
};
