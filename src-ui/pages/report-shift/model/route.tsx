import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const ShiftReportPage = lazy(() =>
  import("../ui/ShiftReportPage").then((m) => ({ default: m.ShiftReportPage }))
);

export const shiftReportPageRoute = {
  path: pathKeys.shift_report(),
  element: <ShiftReportPage />,
};
