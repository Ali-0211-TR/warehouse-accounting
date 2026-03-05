import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import * as React from "react";

import { TablePagination } from "@/shared/ui/components/TablePagination";
import { Button } from "@/shared/ui/shadcn/button";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/shadcn/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/shadcn/table";
import { t } from "i18next";

export interface ServerEntityTableColumn<T> {
  key: string;
  header: string;
  accessor: keyof T | ((item: T) => any);
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

interface ServerEntityTableProps<T> {
  data: T[];
  columns: ServerEntityTableColumn<T>[];
  loading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRowClick?: (item: T) => void;
  onSort?: (field: string, order: 1 | -1) => void;
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;

  // Pagination props
  pageIndex?: number;
  pageCount?: number;
  canPreviousPage?: boolean;
  canNextPage?: boolean;
  onPreviousPage?: () => void;
  onNextPage?: () => void;

  // ✅ NEW: go to exact page (0-based)
  onGoToPage?: (pageIndex: number) => void;

  totalCount?: number;

  // New summary props
  summaryData?: Array<{
    label: string;
    value: string | number;
    className?: string;
    render?: () => React.ReactNode;
  }>;
  summaryTitle?: string;
  summaryPosition?: "top" | "bottom"; // Default: 'bottom'
}

export function ServerEntityTable<T extends { id: number | string | null }>({
  data,
  columns,
  loading = false,
  onEdit,
  onDelete,
  onRowClick,
  onSort,
  actions,
  emptyMessage = "No data available",
  selectable = false,
  onSelectionChange,

  // Pagination props
  pageIndex = 0,
  pageCount = 1,
  canPreviousPage = false,
  canNextPage = false,
  onPreviousPage,
  onNextPage,

  // ✅ NEW
  onGoToPage,

  totalCount,
  summaryData,
  summaryTitle,
  summaryPosition = "bottom",
}: ServerEntityTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Handle server-side sorting
  const handleSort = React.useCallback(
    (columnKey: string) => {
      if (!onSort) return;

      const currentSort = sorting.find((s) => s.id === columnKey);
      let newOrder: 1 | -1 = 1;

      if (currentSort) {
        newOrder = currentSort.desc ? 1 : -1;
      }

      // Update local sorting state for UI
      setSorting([{ id: columnKey, desc: newOrder === -1 }]);

      // Call server-side sort
      onSort(columnKey, newOrder);
    },
    [onSort, sorting]
  );

  // Create TanStack Table columns
  const tableColumns: ColumnDef<T>[] = React.useMemo(() => {
    const cols: ColumnDef<T>[] = [];

    // Selection column
    if (selectable) {
      cols.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      });
    }

    // Data columns
    columns.forEach((column) => {
      cols.push({
        id: column.key,
        accessorKey:
          typeof column.accessor === "string" ? column.accessor : column.key,
        accessorFn:
          typeof column.accessor === "function" ? column.accessor : undefined,
        header:
          column.sortable !== false && onSort
            ? () => {
                const currentSort = sorting.find((s) => s.id === column.key);
                const isSorted = !!currentSort;
                const isDesc = currentSort?.desc || false;

                return (
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(column.key)}
                    className={`h-8 p-0 hover:bg-transparent ${
                      column.align === "center"
                        ? "justify-center"
                        : column.align === "right"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <span className={isSorted ? "font-medium" : ""}>
                      {column.header}
                    </span>
                    {isSorted ? (
                      isDesc ? (
                        <ArrowDown className="ml-2 h-4 w-4" />
                      ) : (
                        <ArrowUp className="ml-2 h-4 w-4" />
                      )
                    ) : (
                      <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                    )}
                  </Button>
                );
              }
            : column.header,
        cell: ({ row }) => {
          const item = row.original;
          const cellClass = `${
            column.align === "center"
              ? "text-center"
              : column.align === "right"
              ? "text-right"
              : "text-left"
          }`;

          return (
            <div className={cellClass}>
              {column.render
                ? column.render(item)
                : typeof column.accessor === "function"
                ? column.accessor(item)
                : (item as any)[column.accessor]}
            </div>
          );
        },
        enableSorting: false, // Disable client-side sorting
        size: column.width
          ? parseInt(column.width.replace(/\D/g, ""))
          : undefined,
      });
    });

    // Actions column
    if (onEdit || onDelete || actions) {
      cols.push({
        id: "actions",
        header: () => (
          <div className="text-center">{t("control.actions", "Actions")}</div>
        ),
        cell: ({ row }) => {
          const item = row.original;

          const hasEdit = !!onEdit;
          const hasDelete = !!onDelete;
          const hasCustomActions = !!actions;
          const hasAnyAction = hasEdit || hasDelete || hasCustomActions;

          if (!hasAnyAction) return null;

          return (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hasEdit && (
                    <DropdownMenuItem onClick={() => onEdit?.(item)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {t("control.edit")}
                    </DropdownMenuItem>
                  )}
                  {hasDelete && (
                    <>
                      {hasEdit && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onClick={() => onDelete?.(item)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t("control.delete")}
                      </DropdownMenuItem>
                    </>
                  )}
                  {hasCustomActions && (
                    <>
                      {(hasEdit || hasDelete) && <DropdownMenuSeparator />}
                      {actions?.(item)}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 60,
      });
    }

    return cols;
  }, [
    columns,
    selectable,
    onEdit,
    onDelete,
    actions,
    sorting,
    handleSort,
    onSort,
  ]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualSorting: true,
    manualPagination: true,
    state: {
      columnVisibility,
      rowSelection,
    },
  });

  // Notify parent of selection changes
  React.useEffect(() => {
    if (!onSelectionChange) return;
    const selectedRows = table.getSelectedRowModel().rows;
    const selectedItems = selectedRows.map((row) => row.original);
    onSelectionChange(selectedItems);
  }, [rowSelection, onSelectionChange, table]);

  // Clear selection when data changes
  React.useEffect(() => {
    setRowSelection({});
  }, [data]);

  const SummarySection = () => {
    if (!summaryData || summaryData.length === 0) return null;

    return (
      <div className="bg-muted/30 border rounded-lg p-4 space-y-2">
        {summaryTitle && (
          <h4 className="font-medium text-sm text-muted-foreground">
            {summaryTitle}
          </h4>
        )}
        <div className="flex flex-wrap gap-4">
          {summaryData.map((item, index) => (
            <div key={index} className={`flex flex-col ${item.className || ""}`}>
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="font-semibold">
                {item.render ? item.render() : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-2">
      {summaryPosition === "top" && <SummarySection />}

      <div className="relative rounded-md border">
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("control.loading")}
            </div>
          </div>
        )}

        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.id === "select"
                        ? "w-10"
                        : header.column.id === "actions"
                        ? "w-32"
                        : columns.find((col) => col.key === header.column.id)
                            ?.width || ""
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    onRowClick
                      ? "cursor-pointer hover:bg-muted/50"
                      : "hover:bg-muted/50"
                  }
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 text-center"
                >
                  {t(emptyMessage)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectable && Object.keys(rowSelection).length > 0 && (
        <div className="flex items-center justify-between py-2">
          <div className="text-sm text-muted-foreground">
            {Object.keys(rowSelection).length} {t("pagination.selected")}
          </div>
        </div>
      )}

      {summaryPosition === "bottom" && <SummarySection />}

      {(onPreviousPage || onNextPage || onGoToPage) && (
        <TablePagination
          pageIndex={pageIndex}
          pageCount={pageCount}
          canPreviousPage={canPreviousPage}
          canNextPage={canNextPage}
          onPreviousPage={onPreviousPage || (() => {})}
          onNextPage={onNextPage || (() => {})}
          // ✅ FIX: прокинули колбэк перехода на страницу
          onGoToPage={onGoToPage}
          selectedCount={Object.keys(rowSelection).length}
          totalCount={totalCount}
        />
      )}
    </div>
  );
}
