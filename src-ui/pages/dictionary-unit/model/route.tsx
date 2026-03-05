import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const UnitPage = lazy(() =>
  import("../ui/unit-page").then((m) => ({ default: m.UnitPage }))
);

export const unitPageRoute = {
  path: pathKeys.units(),
  element: <UnitPage />,
};
