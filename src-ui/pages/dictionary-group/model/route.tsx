import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const GroupPage = lazy(() =>
  import("../ui/group-page").then((m) => ({ default: m.GroupPage }))
);

export const groupPageRoute = {
  path: pathKeys.groups(),
  element: <GroupPage />,
};
