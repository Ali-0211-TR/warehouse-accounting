"use client";

import { getVersion } from "@tauri-apps/api/app";
import {
  ChevronsUpDown,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next"; // Add translation hook
import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/shared/ui/shadcn/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/shadcn/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/ui/shadcn/sidebar";

import { UserEntity } from "@/entities/user";
import { useUser } from "@/features/user";
import { pathKeys } from "@/shared/lib/react-router";

function getInitials(name: string) {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();
}

export function NavUser({ user }: { user: UserEntity }) {
  const { isMobile } = useSidebar();
  const { logout } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [appVersion, setAppVersion] = useState<string>("...");

  // Load app version and machine ID on component mount
  useEffect(() => {
    const loadVersion = async () => {
      try {
        const version = await getVersion();
        setAppVersion(version);
      } catch (error) {
        console.error("Failed to get app version:", error);
        setAppVersion("Unknown");
      }
    };

    loadVersion();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(pathKeys.login());
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="h-8 w-8 rounded-lg">
                {/* No avatar image, just initials */}
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.full_name || user.username)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user.full_name || user.username}
                </span>
                <span className="truncate text-xs">{user.phone_number}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.full_name || user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.full_name || user.username}
                  </span>
                  <span className="truncate text-xs">{user.phone_number}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
              {t("menu.nav.version", {
                version: appVersion,
              })}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => navigate(pathKeys.settings())}>
                <Settings className="mr-2 size-4" />
                {t("menu.nav.settings")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate(pathKeys.profile())}>
                <User className="mr-2 size-4" />
                {t("menu.nav.profile")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 size-4" />
              {t("menu.nav.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

    </SidebarMenu>
  );
}
