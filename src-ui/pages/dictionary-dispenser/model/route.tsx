import { lazy } from "react";

const DispenserPage = lazy(() =>
  import("../ui/dispenser-page").then((m) => ({ default: m.DispenserPage }))
);

export const dispenserPageRoute = {
  path: "/dispensers/",
  element: <DispenserPage />,
};
