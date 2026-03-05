import { PaginationInfo } from "@/shared/const/realworld.types";
import { Button } from "@/shared/ui/shadcn/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/shadcn/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/shadcn/dropdown-menu";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";
import { t } from "i18next";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import React, { ReactNode } from "react";

export interface CardAction<T> {
  label: string;
  icon: ReactNode;
  onClick: (item: T) => void;
  className?: string;
  separatorBefore?: boolean; // Add separator before this action
}

interface ServerEntityCardsProps<T> {
  data: T[];
  loading: boolean;
  pagination: PaginationInfo;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onPageChange: (page: number) => void;
  renderCard: (item: T) => ReactNode;
  emptyMessage?: string;
  customActions?: (item: T) => CardAction<T>[];
  showDefaultActions?: boolean;
}

export function ServerEntityCards<T extends { id?: number | string | null }>({
  data,
  loading,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
  renderCard,
  emptyMessage = "message.no_data",
  customActions,
  showDefaultActions = true,
}: ServerEntityCardsProps<T>) {
  const getActions = (item: T): CardAction<T>[] => {
    const actions: CardAction<T>[] = [];

    // Add default actions first
    if (showDefaultActions) {
      if (onEdit) {
        actions.push({
          label: t("control.edit"),
          icon: <Edit className="h-4 w-4 mr-2" />,
          onClick: onEdit,
        });
      }
      if (onDelete) {
        actions.push({
          label: t("control.delete"),
          icon: <Trash2 className="h-4 w-4 mr-2" />,
          onClick: onDelete,
          className: "text-red-600",
          separatorBefore: true, // Separator before delete
        });
      }
    }

    // Add custom actions after default actions
    if (customActions) {
      const customActionsList = customActions(item);
      // Add separator before first custom action if there are default actions
      if (
        customActionsList.length > 0 &&
        showDefaultActions &&
        (onEdit || onDelete)
      ) {
        customActionsList[0] = {
          ...customActionsList[0],
          separatorBefore: true,
        };
      }
      actions.push(...customActionsList);
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t(emptyMessage)}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {/* Cards */}
      <div className="space-y-3">
        {data.map(item => {
          const actions = getActions(item);
          const hasActions = actions.length > 0;

          return (
            <Card
              key={item.id || Math.random()}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Card Content */}
                  <div className="flex-1 min-w-0">{renderCard(item)}</div>

                  {/* Actions Menu */}
                  {hasActions && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action, index) => (
                          <React.Fragment key={index}>
                            {action.separatorBefore && (
                              <DropdownMenuSeparator />
                            )}
                            <DropdownMenuItem
                              onClick={() => action.onClick(item)}
                              className={action.className}
                            >
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          </React.Fragment>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {t("common.showing")} {data.length} {t("common.of")}{" "}
          {pagination.count} {t("common.records")}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            {t("control.previous")}
          </Button>
          <div className="flex items-center px-3 text-sm">
            {pagination.page} / {pagination.pageCount}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pageCount}
          >
            {t("control.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
