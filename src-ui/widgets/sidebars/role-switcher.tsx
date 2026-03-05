"use client";

import {
  ChevronsUpDown,
  Shield,
  TerminalSquare,
  User,
  UserCog,
} from "lucide-react";

import { useUser } from "@/features/user";
import { RoleType } from "@/shared/bindings/RoleType";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shared/ui/shadcn/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/ui/shadcn/sidebar";
import { t } from "i18next";

export function RoleSwitcher() {
  const { isMobile } = useSidebar();
  const { activeRole, currentUser, setActiveRole } = useUser();

  // Role icon mapping
  const roleIcon = (role: RoleType | null) => {
    switch (role) {
      case "Administrator":
        return <Shield className="size-4 text-blue-950" />;
      case "Manager":
        return <UserCog className="size-4 text-green-700" />;
      case "Seller":
        return <User className="size-4 text-red-950-800" />;
      case "Operator":
        return <TerminalSquare className="size-4 text-purple-700" />;
      default:
        return <User className="size-4 text-muted-foreground" />;
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {roleIcon(activeRole)}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold flex items-center gap-2">
                  {t(`lists.role_type.${activeRole}`)}
                </span>
                <span className="truncate text-xs">
                  {currentUser?.full_name}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("user.roles")}
            </DropdownMenuLabel>
            {currentUser?.roles.map(role => (
              <DropdownMenuItem
                key={role}
                onClick={() => setActiveRole(role)}
                className={`gap-2 p-2 rounded-md transition-colors ${
                  activeRole === role
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : ""
                }`}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border bg-muted/40">
                  {roleIcon(role)}
                </div>
                <span className="font-medium">
                  {t(`lists.role_type.${role}`)}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
