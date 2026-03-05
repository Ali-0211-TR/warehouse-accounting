import { pathKeys } from "@/shared/lib/react-router";
import { lazy } from "react";

const ClientPage = lazy(() =>
  import("../ui/client-page").then((m) => ({ default: m.ClientPage }))
);

export const clientPageRoute = {
  path: pathKeys.clients(),
  element: <ClientPage />,
};
