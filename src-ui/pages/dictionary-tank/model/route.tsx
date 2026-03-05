import { lazy } from "react";

const TankPage = lazy(() =>
  import("../ui/tank-page").then((m) => ({ default: m.TankPage }))
);

export const tankPageRoute = {
  path: "/tanks/",
  element: <TankPage />,
};
