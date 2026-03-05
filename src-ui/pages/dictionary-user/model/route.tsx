import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const UserPage = lazy(() =>
  import("../ui/user-page").then((m) => ({ default: m.UserPage }))
);

export const userPageRoute = {
  path: pathKeys.users(),
  element: <UserPage />,
};
