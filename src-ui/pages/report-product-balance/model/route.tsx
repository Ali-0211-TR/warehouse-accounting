import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const ProductBalancePage = lazy(() =>
  import("../ui/ProductBalancePage").then((m) => ({ default: m.ProductBalancePage }))
);

export const productBalancePageRoute = {
  path: pathKeys.product_report(),
  element: <ProductBalancePage />,
};
