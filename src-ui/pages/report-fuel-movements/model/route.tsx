import { lazy } from "react";

const FuelMovementsReportPage = lazy(() =>
  import("../ui/FuelMovementsReportPage").then((module) => ({
    default: module.FuelMovementsReportPage,
  })),
);

export const fuelMovementsReportPageRoute = {
  path: "/fuel-movements/",
  element: <FuelMovementsReportPage />,
};
