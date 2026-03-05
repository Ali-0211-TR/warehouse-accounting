"use client";

import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  ChevronsUpDown,
  HelpCircle,
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
  const { t, i18n } = useTranslation(); // Add translation hook and i18n instance
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

  const handleHelp = async () => {

    // Build docs URL using current UI language and app version.
    // Use first part of the i18n language (e.g. 'ru' from 'ru-RU') and normalize version to start with 'v'.
    const lang = (i18n?.language || "ru").split("-")[0];
    const versionPath = appVersion && appVersion !== "..." ? (appVersion.startsWith("v") ? appVersion : `v${appVersion}`) : "latest";
    const url = `https://texnouz.uz/${lang}/documents/sklad-uchot/${versionPath}`;

    try {
      // First try: Use Tauri's opener plugin
      await openUrl(url);
      return; // Success, exit early
    } catch (error) {
      console.error(
        "Failed to open help documentation with Tauri opener:",
        error
      );
      console.error("Error details:", JSON.stringify(error, null, 2));
    }

    // Second try: Use global Tauri API if available
    try {
      if (typeof window !== "undefined" && (window as any).__TAURI__?.opener) {
        await (window as any).__TAURI__.opener.openUrl(url);
        return; // Success, exit early
      }
    } catch (error) {
      console.error(
        "Failed to open help documentation with global Tauri API:",
        error
      );
    }

    // Fallback to browser methods
    try {
      // Method 1: Try window.open with additional parameters
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");

      if (newWindow) {
        newWindow.focus();
        return; // Success, exit early
      } else {
        // Method 2: Create a temporary anchor element
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return; // Assume success
      }
    } catch (fallbackError) {
      console.error("All methods failed:", fallbackError);

      // Final fallback - copy URL to clipboard
      try {
        await navigator.clipboard.writeText(url);
        alert(`Help URL copied to clipboard: ${url}`);
      } catch (clipboardError) {
        console.error("Failed to copy to clipboard:", clipboardError);
        alert(`Please manually open: ${url}`);
      }
    }
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
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => handleHelp()}>
                <HelpCircle className="mr-2 size-4" />
                {t("menu.nav.help")}
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
