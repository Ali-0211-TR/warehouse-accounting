import { orderPageRoute } from "@/pages/main-order/model/route";
import { shiftPageRoute } from "@/pages/main-shift/model/route";
import { profilePageRoute } from "@/pages/profile";
import { movementsReportPageRoute } from "@/pages/report-movements";
import { productBalancePageRoute } from "@/pages/report-product-balance/model/route";
import { shiftReportPageRoute } from "@/pages/report-shift/model/route";
import { summaryReportPageRoute } from "@/pages/report-summary";
import { comparisonReportPageRoute } from "@/pages/report-comparison/model/route";
import { settingsPageRoute } from "@/pages/settings";
import { testPrintPageRoute } from "@/pages/test-print/model/route";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import {
  createBrowserRouter,
  redirect,
  RouterProvider,
  useRouteError,
} from "react-router-dom";
import { accessDeniedRoute } from "../../pages/access-denied";
import { markPageRoute } from "../../pages/dicitonary-mark";
import { unitPageRoute } from "../../pages/dictioanary-unit";
import { clientPageRoute } from "../../pages/dictionary-client";
import { discountPageRoute } from "../../pages/dictionary-discount";
import { groupPageRoute } from "../../pages/dictionary-group";
import { productPageRoute } from "../../pages/dictionary-product";
import { taxPageRoute } from "../../pages/dictionary-tax";
import { userPageRoute } from "../../pages/dictionary-user";
import { GenericLayout, GuestLayout, NakedLayout } from "../../pages/layouts";
import { loginPageRoute } from "../../pages/login";
import { contractPageRoute } from "../../pages/main-contract";
import { homePageRoute } from "../../pages/main-home";
import { page404Route } from "../../pages/page-404";
import { pathKeys } from "../../shared/lib/react-router";
import { salesPageRoute } from "@/pages/operations-sales";
import { incomePageRoute } from "@/pages/operations-income";
import { outcomePageRoute } from "@/pages/operations-outcome";
import { returnsPageRoute } from "@/pages/operations-returns";

function BubbleError() {
  const error = useRouteError();
  if (error) throw error;
  return null;
}

// Helper function to wrap routes with protection
function createProtectedRoute(route: any, permission: string) {
  return {
    ...route,
    element: (
      <ProtectedRoute requiredPermission={permission}>
        {route.element}
      </ProtectedRoute>
    ),
  };
}

const router = createBrowserRouter([
  {
    errorElement: <BubbleError />,
    children: [
      {
        element: <GenericLayout />,
        children: [
          page404Route,
          accessDeniedRoute,

          // Main pages with protection
          createProtectedRoute(homePageRoute, "home"),
          createProtectedRoute(shiftPageRoute, "shifts"),
          createProtectedRoute(orderPageRoute, "orders"),
          createProtectedRoute(contractPageRoute, "contracts"),
          createProtectedRoute(clientPageRoute, "clients"),

          // Operation pages with protection
          createProtectedRoute(salesPageRoute, "orders"),
          createProtectedRoute(incomePageRoute, "orders"),
          createProtectedRoute(outcomePageRoute, "orders"),
          createProtectedRoute(returnsPageRoute, "orders"),

          // Dictionary pages with protection
          createProtectedRoute(userPageRoute, "users"),
          createProtectedRoute(discountPageRoute, "discounts"),
          createProtectedRoute(groupPageRoute, "groups"),
          createProtectedRoute(productPageRoute, "products"),
          createProtectedRoute(markPageRoute, "marks"),
          createProtectedRoute(unitPageRoute, "units"),
          createProtectedRoute(taxPageRoute, "taxes"),

          // Settings and profile
          createProtectedRoute(settingsPageRoute, "settings"),
          createProtectedRoute(profilePageRoute, "profile"),

          // Test pages (development)
          testPrintPageRoute,

          // Report pages with protection
          createProtectedRoute(summaryReportPageRoute, "summary"),
          createProtectedRoute(shiftReportPageRoute, "shift_report"),
          createProtectedRoute(productBalancePageRoute, "product_report"),
          createProtectedRoute(movementsReportPageRoute, "movements_report"),
          createProtectedRoute(comparisonReportPageRoute, "summary"),
        ],
      },
      {
        element: <GuestLayout />,
        children: [loginPageRoute],
      },
      {
        element: <NakedLayout />,
        children: [page404Route],
      },
      {
        loader: async () => redirect(pathKeys.page404()),
        path: "*",
      },
    ],
  },
]);

export function BrowserRouter() {
  return <RouterProvider router={router} />;
}
