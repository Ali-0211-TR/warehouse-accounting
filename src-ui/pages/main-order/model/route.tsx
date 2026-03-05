import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const OrderPage = lazy(() =>
  import("../ui/OrderPage").then((m) => ({ default: m.OrderPage }))
);

export const orderPageRoute = {
  path: pathKeys.orders(),
  element: <OrderPage />,
};
