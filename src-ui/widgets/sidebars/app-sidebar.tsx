import {
  BarChart3,
  BookOpen,
  Home,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useUser } from "@/features/user";
import { filterMenuItems } from "@/shared/lib/auth/role-permissions";
import { pathKeys } from "@/shared/lib/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/shared/ui/shadcn/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { RoleSwitcher } from "./role-switcher";

// Menu item types
interface MenuSubItem {
  title: string;
  url: string;
}
interface MenuItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: MenuSubItem[];
}

// Warehouse management menu structure
const navMain: MenuItem[] = [
  {
    title: "menu.main.title",
    url: "#",
    icon: Home,
    items: [
      { title: "menu.main.dashboard", url: pathKeys.home() },
      { title: "menu.main.shifts", url: pathKeys.shift() },
      { title: "menu.main.clients", url: pathKeys.clients() },
      { title: "menu.main.contracts", url: pathKeys.contracts() },
    ],
  },
  {
    title: "menu.operations.title",
    url: "#",
    icon: ShoppingCart,
    items: [
      { title: "menu.operations.orders", url: pathKeys.orders() },
      { title: "menu.operations.sales", url: pathKeys.sales() },
      { title: "menu.operations.income", url: pathKeys.income() },
      { title: "menu.operations.outcome", url: pathKeys.outcome() },
      { title: "menu.operations.returns", url: pathKeys.returns() },
    ],
  },
  {
    title: "menu.report.title",
    url: "#",
    icon: BarChart3,
    items: [
      { title: "menu.report.summary", url: pathKeys.summary() },
      { title: "menu.report.shift_report", url: pathKeys.shift_report() },
      { title: "menu.report.product_report", url: pathKeys.product_report() },
      { title: "menu.report.product_movements", url: pathKeys.movements_report() },
      { title: "menu.report.comparison", url: pathKeys.comparison() },
    ],
  },
  {
    title: "menu.dictionary.title",
    url: "#",
    icon: BookOpen,
    items: [
      { title: "menu.dictionary.products", url: pathKeys.products() },
      { title: "menu.dictionary.groups", url: pathKeys.groups() },
      { title: "menu.dictionary.discounts", url: pathKeys.discounts() },
      { title: "menu.dictionary.users", url: pathKeys.users() },
      { title: "menu.dictionary.taxes", url: pathKeys.taxes() },
      { title: "menu.dictionary.units", url: pathKeys.units() },
      { title: "menu.dictionary.marks", url: pathKeys.marks() },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { logout, currentUser, activeRole } = useUser();

  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      logout();
      navigate(pathKeys.login());
    }
  }, [currentUser, logout, navigate]);

  // Filter menu items based on the active role
  const filteredNavMain = useMemo(() => {
    if (!activeRole) return [];
    return filterMenuItems(navMain, [activeRole]);
  }, [activeRole]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <RoleSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
      </SidebarContent>
      <SidebarFooter>
        {currentUser && <NavUser user={currentUser} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
