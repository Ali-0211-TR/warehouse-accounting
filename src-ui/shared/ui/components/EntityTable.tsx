"use client";

import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Loader2,
  MoreHorizontal,
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
  DropdownMenuLabel,
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

export interface EntityTableColumn<T> {
  key: string;
  header: string;
  accessor: keyof T | ((item: T) => any);
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

interface EntityTableProps<T> {
  data: T[];
  columns: EntityTableColumn<T>[];
  loading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  pageSize?: number;
}

export function EntityTable<T extends { id: number | string | null }>({
  data,
  columns,
  loading = false,
  onEdit,
  onDelete,
  onRowClick,
  actions,
  emptyMessage = "message.no_data",
  selectable = false,
  onSelectionChange,
  pageSize = 20,
}: EntityTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

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
          column.sortable !== false
            ? ({ column: col }) => (
                <Button
                  variant="ghost"
                  onClick={() => col.toggleSorting(col.getIsSorted() === "asc")}
                  className={`h-8 p-0 ${
                    column.align === "center"
                      ? "justify-center"
                      : column.align === "right"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {column.header}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              )
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
        enableSorting: column.sortable !== false,
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
          return (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">
                      {t("control.actions", "Actions")}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {t("control.actions", "Actions")}
                  </DropdownMenuLabel>
                  {actions && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1">{actions(item)}</div>
                    </>
                  )}
                  {(onEdit || onDelete) && actions && <DropdownMenuSeparator />}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {t("control.edit")}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(item)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("control.delete")}
                    </DropdownMenuItem>
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
  }, [columns, selectable, onEdit, onDelete, actions]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    autoResetPageIndex: false,
    autoResetAll: false,
    autoResetExpanded: false,
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
  });

  // Notify parent of selection changes
  React.useEffect(() => {
    if (!onSelectionChange) return;
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedItems = selectedRows.map((row) => row.original);
    onSelectionChange(selectedItems);
  }, [rowSelection, onSelectionChange, table]);

  return (
    <div className="w-full">
      {/* Table */}
      <div className="relative rounded-md border mb-2">
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("control.loading")}
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {Object.keys(rowSelection).length > 0 && (
            <span>
              {Object.keys(rowSelection).length} {t("pagination.of")}{" "}
              {table.getFilteredRowModel().rows.length}{" "}
              {t("pagination.selected")}
            </span>
          )}
        </div>

        <TablePagination
          pageIndex={table.getState().pagination.pageIndex}
          pageCount={table.getPageCount()}
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
          onPreviousPage={() => table.previousPage()}
          onNextPage={() => table.nextPage()}
          // ✅ FIX: передали функцию для GoTo
          onGoToPage={(pageIndex) => table.setPageIndex(pageIndex)}
          selectedCount={Object.keys(rowSelection).length}
          totalCount={table.getFilteredRowModel().rows.length}
        />
      </div>
    </div>
  );
}
