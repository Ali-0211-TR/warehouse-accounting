import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const ProductPage = lazy(() =>
  import("../ui/product-page").then((m) => ({ default: m.ProductPage }))
);

export const productPageRoute = {
  path: pathKeys.products(),
  element: <ProductPage />,
};
