import { lazy } from "react";

const DispenserPortPage = lazy(() =>
  import("../ui/dispenser-port-page").then((m) => ({ default: m.DispenserPortPage }))
);

export const dispenserPortPageRoute = {
  path: "/dispenser-ports/",
  element: <DispenserPortPage />,
};
