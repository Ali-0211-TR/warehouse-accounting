import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const DiscountPage = lazy(() =>
  import("../ui/discount-page").then((m) => ({ default: m.DiscountPage }))
);

export const discountPageRoute = {
  path: pathKeys.discounts(),
  element: <DiscountPage />,
};
