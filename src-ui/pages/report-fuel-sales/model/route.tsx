import { lazy } from "react";

const FuelSaleReportPage = lazy(() =>
  import("../ui/FuelSalesReportPage").then((module) => ({
    default: module.FuelSaleReportPage,
  })),
);

export const fuelSaleReportPageRoute = {
  path: "/fuel-sale/",
  element: <FuelSaleReportPage />,
};
