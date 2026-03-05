import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const OutcomePage = lazy(() =>
  import("../ui/OutcomePage").then((m) => ({ default: m.OutcomePage }))
);

export const outcomePageRoute = {
  path: pathKeys.outcome(),
  element: <OutcomePage />,
};
