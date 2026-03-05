import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const MarkPage = lazy(() =>
  import("../ui/mark-page").then((m) => ({ default: m.MarkPage }))
);

export const markPageRoute = {
  path: pathKeys.marks(),
  element: <MarkPage />,
};
