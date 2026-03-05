import type { ShiftEntity } from "@/entities/shift";
import {
  ServerEntityCards,
  type CardAction,
} from "@/shared/ui/components/ServerEntityCards";
import { ServerEntityTable } from "@/shared/ui/components/ServerEntityTable";
import { Badge } from "@/shared/ui/shadcn/badge";
import { DropdownMenuItem } from "@/shared/ui/shadcn/dropdown-menu";
import { t } from "i18next";
import { Calendar, CheckCircle, Clock, Eye, User, XCircle } from "lucide-react";
import { useState } from "react";
import { ShiftViewDialog } from "./shift-view-dialog";

import { PaginationInfo } from "@/shared/const/realworld.types";
import { format } from "date-fns";

// Helper function to shorten UUID for display (last 8 characters)
const shortenShiftId = (shiftId: string): string => {
  if (!shiftId || shiftId.length <= 8) return shiftId;
  return shiftId.slice(-8);
};

interface ShiftListProps {
  shifts: ShiftEntity[];
  loading: boolean;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  // onPageSizeChange: (pageSize: number) => void;
  onSort: (field: string, order: 1 | -1) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: ShiftEntity[]) => void;
  onRowClick?: (shift: ShiftEntity) => void;
}

export function ShiftList({
  shifts,
  loading,
  pagination,
  onPageChange,
  onSort,
  selectable = false,
  onSelectionChange,
  onRowClick,
}: ShiftListProps) {
  const [selectedShift, setSelectedShift] = useState<ShiftEntity | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), "dd.MM.yyyy HH:mm");
  };

  const calculateDuration = (shift: ShiftEntity): string => {
    if (!shift.d_close) return "—";

    const start = new Date(shift.d_open);
    const end = new Date(shift.d_close);
    const diff = end.getTime() - start.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}ч ${minutes}м`;
  };

  const handleViewClick = (shift: ShiftEntity) => {
    setSelectedShift(shift);
    setViewDialogOpen(true);
  };

  const handleCloseView = () => {
    setViewDialogOpen(false);
    setSelectedShift(null);
  };

  // Render function for shift card
  const renderShiftCard = (shift: ShiftEntity) => {
    const isClosed = !!shift.d_close;
    return (
      <>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <h3 className="font-semibold truncate">
                #{shift.id ? shortenShiftId(shift.id) : "—"}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground truncate">
                {shift.user_open?.username}
              </p>
            </div>
          </div>
          <Badge
            variant={isClosed ? "default" : "secondary"}
            className={`text-xs whitespace-nowrap ${
              isClosed
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            <div className="flex items-center space-x-1">
              {isClosed ? (
                <XCircle className="h-3 w-3" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              <span>
                {t(isClosed ? "shift.status_closed" : "shift.status_open")}
              </span>
            </div>
          </Badge>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {t("shift.d_open")}
              </p>
              <p className="text-xs font-medium truncate">
                {formatDateTime(shift.d_open)}
              </p>
            </div>
          </div>
          {shift.d_close ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <Calendar className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {t("shift.d_close")}
                </p>
                <p className="text-xs font-medium truncate">
                  {formatDateTime(shift.d_close)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {t("shift.d_close")}
                </p>
                <p className="text-xs">—</p>
              </div>
            </div>
          )}
          {shift.user_close && (
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {t("shift.user_close")}
                </p>
                <p className="text-xs font-medium truncate">
                  {shift.user_close.username}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {t("shift.duration")}
              </p>
              <p className="text-xs font-medium">{calculateDuration(shift)}</p>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Custom actions for shift cards
  const getShiftCardActions = (): CardAction<ShiftEntity>[] => {
    const actions: CardAction<ShiftEntity>[] = [
      {
        label: t("control.view_details"),
        icon: <Eye className="h-4 w-4 mr-2" />,
        onClick: shift => handleViewClick(shift),
      },
    ];
    if (onRowClick) {
      actions.unshift({
        label: t("shift.view_report", "Отчёт за смену"),
        icon: <Eye className="h-4 w-4 mr-2" />,
        onClick: shift => onRowClick(shift),
      });
    }
    return actions;
  };

  const columns = [
    {
      key: "id",
      header: t("shift.shift_id"),
      accessor: (shift: ShiftEntity) => shift.id || "",
      width: "w-28",
      sortable: true,
      render: (shift: ShiftEntity) => (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-purple-600" />
          <span className="font-mono text-sm font-medium">
            #{shift.id ? shortenShiftId(shift.id) : "—"}
          </span>
        </div>
      ),
    },
    {
      key: "user_open",
      header: t("shift.user_open"),
      accessor: (shift: ShiftEntity) => shift.user_open?.username || "",
      sortable: true,
      render: (shift: ShiftEntity) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{shift.user_open?.username}</span>
        </div>
      ),
    },
    {
      key: "d_open",
      header: t("shift.d_open"),
      accessor: (shift: ShiftEntity) => shift.d_open,
      width: "w-40",
      sortable: true,
      render: (shift: ShiftEntity) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-green-600" />
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {formatDateTime(shift.d_open)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "d_close",
      header: t("shift.d_close"),
      accessor: (shift: ShiftEntity) => shift.d_close || "",
      width: "w-40",
      sortable: true,
      render: (shift: ShiftEntity) =>
        shift.d_close ? (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-red-600" />
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {formatDateTime(shift.d_close)}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "user_close",
      header: t("shift.user_close"),
      accessor: (shift: ShiftEntity) => shift.user_close?.username || "",
      render: (shift: ShiftEntity) =>
        shift.user_close ? (
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-red-600" />
            <span className="font-medium">{shift.user_close.username}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "duration",
      header: t("shift.duration"),
      accessor: (shift: ShiftEntity) => calculateDuration(shift),
      width: "w-24",
      align: "center" as const,
      render: (shift: ShiftEntity) => (
        <div className="flex items-center justify-center space-x-1">
          <Clock className="h-4 w-4 text-orange-600" />
          <span className="font-medium">{calculateDuration(shift)}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: t("shift.status"),
      accessor: (shift: ShiftEntity) => (shift.d_close ? "closed" : "open"),
      width: "w-24",
      render: (shift: ShiftEntity) => {
        const isClosed = !!shift.d_close;
        return (
          <Badge
            variant={isClosed ? "default" : "secondary"}
            className={`text-xs ${
              isClosed
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            <div className="flex items-center space-x-1">
              {isClosed ? (
                <XCircle className="h-3 w-3" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              <span>
                {t(isClosed ? "shift.status_closed" : "shift.status_open")}
              </span>
            </div>
          </Badge>
        );
      },
    },
  ];

  return (
    <div>
      <div className="space-y-4">
        {/* Card View for Small/Medium Screens */}
        <div className="lg:hidden px-3 sm:px-4">
          <ServerEntityCards
            data={shifts}
            loading={loading}
            pagination={pagination}
            onPageChange={onPageChange}
            renderCard={renderShiftCard}
            customActions={getShiftCardActions}
            showDefaultActions={false}
          />
        </div>

        {/* Table View for Large Screens */}
        <div className="hidden lg:block">
          <ServerEntityTable
            data={shifts}
            columns={columns}
            loading={loading}
            onSort={onSort}
            emptyMessage={"message.no_data"}
            selectable={selectable}
            onSelectionChange={onSelectionChange}
            actions={shift => (
              <>
                {onRowClick && (
                  <DropdownMenuItem onClick={() => onRowClick(shift)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t("shift.view_report", "Отчёт за смену")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleViewClick(shift)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {t("control.view_details")}
                </DropdownMenuItem>
              </>
            )}
            // Pagination props
            pageIndex={pagination.page - 1} // Convert 1-based to 0-based
            pageCount={pagination.pageCount}
            canPreviousPage={pagination.page > 1}
            canNextPage={pagination.page < pagination.pageCount}
            onPreviousPage={() => onPageChange(pagination.page - 1)}
            onGoToPage={(pageIndex0) => onPageChange(pageIndex0 + 1)}
            onNextPage={() => onPageChange(pagination.page + 1)}
            totalCount={pagination.count}
          />
        </div>
      </div>

      {/* View Dialog */}
      <ShiftViewDialog
        open={viewDialogOpen}
        onClose={handleCloseView}
        shift={selectedShift}
      />
    </div>
  );
}
