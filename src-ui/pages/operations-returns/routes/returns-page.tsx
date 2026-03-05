import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const ReturnsPage = lazy(() =>
  import("../ui/ReturnsPage").then((m) => ({ default: m.ReturnsPage }))
);

export const returnsPageRoute = {
  path: pathKeys.returns(),
  element: <ReturnsPage />,
};
