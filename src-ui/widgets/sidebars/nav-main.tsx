import { ChevronRight, type LucideIcon } from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/shared/ui/shadcn/collapsible"
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/shared/ui/shadcn/sidebar"
import { useTranslation } from "react-i18next"
import { useNavigate, useLocation } from "react-router-dom"

export function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: LucideIcon
        isActive?: boolean
        items?: {
            title: string
            url: string
        }[]
    }[]
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { setOpenMobile } = useSidebar();

    // Helper function to check if a path is active
    const isPathActive = (url: string) => {
        // Remove trailing slash for comparison
        const currentPath = location.pathname.replace(/\/$/, '') || '/';
        const itemPath = url.replace(/\/$/, '') || '/';

        // Exact match for root path
        if (itemPath === '/') {
            return currentPath === '/';
        }

        // For other paths, check if current path starts with item path
        return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
    };

    // Helper function to check if any sub-item is active
    const isGroupActive = (item: any) => {
        if (item.items) {
            return item.items.some((subItem: any) => isPathActive(subItem.url));
        }
        return isPathActive(item.url);
    };

    const handleItemClick = (item: { url?: string; command?: () => void }) => {
        if (item.command) {
            item.command()
        } else if (item.url) {
            navigate(item.url)
        }
        // Close mobile sidebar after navigation
        setOpenMobile(false);
    }

    return (
        <SidebarGroup>
            {/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
            <SidebarMenu>
                {items.map((item) => {
                    const hasActiveSubItem = isGroupActive(item);
                    const isCollapsibleOpen = item.isActive || hasActiveSubItem;

                    return (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={isCollapsibleOpen}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        isActive={hasActiveSubItem}
                                    >
                                        {item.icon && <item.icon />}
                                        <span>{t(item.title)}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items?.map((subItem) => {
                                            const isActive = isPathActive(subItem.url);
                                            return (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        onClick={() => handleItemClick(subItem)}
                                                        isActive={isActive}
                                                        className="transition-all duration-200 hover:translate-x-1"
                                                    >
                                                        <button className="flex items-center gap-3 w-full relative group">
                                                            {/* Active indicator bar */}
                                                            <div
                                                                className={`absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r-full transition-all duration-200 ${isActive
                                                                        ? 'bg-sidebar-accent-foreground opacity-100'
                                                                        : 'bg-transparent opacity-0'
                                                                    }`}
                                                            />
                                                            <span className={`flex-1 text-left transition-colors duration-200 ${isActive
                                                                    ? 'text-sidebar-accent-foreground font-medium'
                                                                    : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground'
                                                                }`}>
                                                                {t(subItem.title)}
                                                            </span>
                                                        </button>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            );
                                        })}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}
