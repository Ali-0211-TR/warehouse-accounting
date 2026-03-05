import { lazy } from "react";

const TestPrintPage = lazy(() =>
  import("../TestPrintPage").then((m) => ({ default: m.TestPrintPage }))
);

export const testPrintPageRoute = {
  path: "/test-print",
  element: <TestPrintPage />,
};
