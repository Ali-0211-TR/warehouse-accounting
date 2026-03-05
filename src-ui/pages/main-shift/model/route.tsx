import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const ShiftPage = lazy(() =>
  import("../ui/shift-page").then((m) => ({ default: m.ShiftPage }))
);

export const shiftPageRoute = {
  path: pathKeys.shift(),
  element: <ShiftPage />,
};
