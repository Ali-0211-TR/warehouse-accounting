import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const TaxPage = lazy(() =>
  import("../ui/tax-page").then((m) => ({ default: m.TaxPage }))
);

export const taxPageRoute = {
  path: pathKeys.taxes(),
  element: <TaxPage />,
};
