import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const IncomePage = lazy(() =>
  import("../ui/IncomePage").then((m) => ({ default: m.IncomePage }))
);

export const incomePageRoute = {
  path: pathKeys.income(),
  element: <IncomePage />,
};
