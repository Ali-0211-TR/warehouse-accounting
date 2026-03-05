import { lazy } from "react";

const CameraPage = lazy(() =>
  import("../ui/camera-page").then((m) => ({ default: m.CameraPage }))
);

export const cameraPageRoute = {
  path: "/cameras/",
  element: <CameraPage />,
};
