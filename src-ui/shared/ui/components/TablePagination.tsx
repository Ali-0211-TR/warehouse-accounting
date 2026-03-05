import * as React from "react";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import { t } from "i18next";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CornerDownLeft,
} from "lucide-react";

interface TablePaginationProps {
  pageIndex: number; // 0-based
  pageCount: number; // total pages
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onGoToPage?: (pageIndex: number) => void;
  selectedCount?: number;
  totalCount?: number;
}

export function TablePagination({
  pageIndex,
  pageCount,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  onGoToPage,
  selectedCount,
  totalCount,
}: TablePaginationProps) {
  const [pageInput, setPageInput] = React.useState(String(pageIndex + 1));

  React.useEffect(() => {
    setPageInput(String(pageIndex + 1));
  }, [pageIndex]);

  const clamp = (v: number) =>
    Math.min(Math.max(v, 1), Math.max(pageCount, 1));

  const commit = React.useCallback(() => {
    if (!onGoToPage) return;

    const value = Number(pageInput);
    if (!Number.isFinite(value)) return;

    const page = clamp(Math.trunc(value)) - 1;
    if (page !== pageIndex) onGoToPage(page);
  }, [pageInput, pageIndex, pageCount, onGoToPage]);

  const isFirst = pageIndex <= 0;
  const isLast = pageIndex >= pageCount - 1;

  return (
    <div className="mt-3 w-full">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Selection info */}
        <div className="text-sm text-muted-foreground">
          {selectedCount && totalCount ? (
            <span>
              {selectedCount} {t("pagination.of")} {totalCount}{" "}
              {t("pagination.selected")}
            </span>
          ) : null}
        </div>

        {/* Pagination controls */}
        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center lg:gap-3">
          {/* Page info */}
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {t("pagination.page")} {pageIndex + 1} {t("pagination.of")}{" "}
            {pageCount}
          </div>

          {/* Unified control group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* First */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => onGoToPage?.(0)}
              disabled={!onGoToPage || isFirst}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Prev */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={onPreviousPage}
              disabled={!canPreviousPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page input */}
            <Input
              inputMode="numeric"
              className="h-9 w-16 text-center"
              value={pageInput}
              onChange={(e) =>
                setPageInput(e.target.value.replace(/[^\d]/g, ""))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape")
                  setPageInput(String(pageIndex + 1));
              }}
            />

            {/* Confirm */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={commit}
              disabled={!onGoToPage}
              title={t("pagination.go") || "Go"}
            >
              <CornerDownLeft className="h-4 w-4" />
            </Button>

            {/* Next */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={onNextPage}
              disabled={!canNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => onGoToPage?.(pageCount - 1)}
              disabled={!onGoToPage || isLast}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
