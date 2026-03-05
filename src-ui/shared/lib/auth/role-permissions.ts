import type { RoleType } from "@/shared/bindings/RoleType";

export interface RoutePermission {
  roles: RoleType[];
}

// Define route permissions for each page
export const routePermissions: Record<string, RoutePermission> = {
  // Main pages
  home: {
    roles: ["Administrator", "Manager", "Seller"],
  },
  shifts: {
    roles: ["Administrator", "Manager", "Seller"],
  },
  orders: {
    roles: ["Administrator", "Manager", "Seller"],
  },
  contracts: {
    roles: ["Administrator", "Manager"],
  },
  clients: {
    roles: ["Administrator", "Manager", "Seller"],
  },

  // Operations
  sales: {
    roles: ["Administrator", "Manager", "Seller"],
  },
  income: {
    roles: ["Administrator", "Manager"],
  },
  outcome: {
    roles: ["Administrator", "Manager"],
  },
  returns: {
    roles: ["Administrator", "Manager", "Seller"],
  },

  // Reports
  summary: {
    roles: ["Administrator", "Manager", "Seller"],
  },
  shift_report: {
    roles: ["Administrator", "Manager", "Seller"],
  },
  product_report: {
    roles: ["Administrator", "Manager"],
  },
  movements_report: {
    roles: ["Administrator", "Manager"],
  },

  // Dictionary pages
  products: {
    roles: ["Administrator", "Manager"],
  },
  discounts: {
    roles: ["Administrator", "Manager"],
  },
  users: {
    roles: ["Administrator"],
  },
  groups: {
    roles: ["Administrator", "Manager"],
  },
  taxes: {
    roles: ["Administrator", "Manager"],
  },
  units: {
    roles: ["Administrator", "Manager"],
  },
  marks: {
    roles: ["Administrator", "Manager"],
  },

  // Settings and profile
  settings: {
    roles: ["Administrator"],
  },
  profile: {
    roles: ["Administrator", "Manager", "Seller"],
  },
};

export function hasPermission(
  userRoles: RoleType[],
  routeKey: string
): boolean {
  const permission = routePermissions[routeKey];
  if (!permission) return false;

  return userRoles.some(role => permission.roles.includes(role));
}

// Updated function to properly handle all properties
export function filterMenuItems<T extends { url: string; items?: T[] }>(
  menuItems: T[],
  userRoles: RoleType[]
): T[] {
  return menuItems
    .map(item => {
      // Filter sub-items if they exist
      const filteredItems = item.items
        ? filterMenuItems(item.items, userRoles)
        : undefined;

      // Return item with filtered sub-items, preserving all original properties
      return {
        ...item,
        items: filteredItems,
      };
    })
    .filter(item => {
      // Keep parent items if they have accessible sub-items
      if (item.items && item.items.length > 0) {
        return true;
      }

      // For leaf items, check permissions
      const routeKey = getRouteKeyFromUrl(item.url);
      return routeKey ? hasPermission(userRoles, routeKey) : false;
    });
}

function getRouteKeyFromUrl(url: string): string | null {
  // Remove trailing slash and leading slash for consistent matching
  const cleanUrl = url.replace(/\/$/, "") || "/";

  // Map URLs to route keys
  const urlToRouteMap: Record<string, string> = {
    "/": "home",
    "/shift": "shifts",
    "/orders": "orders",
    "/contracts": "contracts",
    "/clients": "clients",

    "/sales": "sales",
    "/income": "income",
    "/outcome": "outcome",
    "/returns": "returns",

    "/summary": "summary",
    "/shift_report": "shift_report",
    "/product_report": "product_report",
    "/movements_report": "movements_report",

    "/products": "products",
    "/discounts": "discounts",
    "/user": "users",
    "/groups": "groups",
    "/taxes": "taxes",
    "/units": "units",
    "/marks": "marks",
    "/settings": "settings",
    "/profile": "profile",
  };

  return urlToRouteMap[cleanUrl] || null;
}
