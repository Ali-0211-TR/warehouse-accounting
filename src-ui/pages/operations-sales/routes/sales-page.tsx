import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const SalesPage = lazy(() =>
  import("../ui/SalesPage").then((m) => ({ default: m.SalesPage }))
);

export const salesPageRoute = {
  path: pathKeys.sales(),
  element: <SalesPage />,
};
