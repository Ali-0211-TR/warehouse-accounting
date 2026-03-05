import { Check, ChevronsUpDown, Loader2, Clock, X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/shared/ui/shadcn/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import { useCallback, useEffect, useMemo } from "react";
import { useShiftStore } from "../model/store";
import { ShiftEntity } from "../model/types";

type SelectShiftProps = {
  value?: ShiftEntity | null;
  onSelect?: (shift: ShiftEntity | null) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
};

export const ShiftSelector = React.memo(
  ({
    value,
    onSelect,
    placeholder,
    emptyText,
    className,
    disabled = false,
    required = false,
    error,
  }: SelectShiftProps) => {
    const { t } = useTranslation();
    const { shifts, loadShifts, loading } = useShiftStore();
    const [open, setOpen] = React.useState(false);
    const [loadError, setLoadError] = React.useState<string | null>(null);

    // Use translations with fallbacks
    const placeholderText =
      placeholder || t("shift.select_shift", "Select shift...");
    const emptyText_ =
      emptyText || t("shift.no_shift_found", "No shift found.");

    // Memoize load shifts function to prevent unnecessary re-renders
    const loadShiftsWithParams = useCallback(
      async () => {
        try {
          setLoadError(null);
          await loadShifts({
            first: 0,
            rows: 50,
            sortField: "DOpen",
            sortOrder: "Desc",
            filters: {
              search: "",
              user_id: undefined,
              date_range: undefined,
              is_open: undefined,
            },
          });
        } catch (error) {
          console.error("Failed to load shifts:", error);
          setLoadError(t("shift.loading_error", "Failed to load shifts"));
        }
      },
      [loadShifts, t],
    );

    // Load shifts when popover opens (initial load)
    useEffect(() => {
      if (open && shifts.length === 0) {
        loadShiftsWithParams();
      }
    }, [open, shifts.length, loadShiftsWithParams]);

    const handleSelect = useCallback(
      (selectedShift: ShiftEntity) => {
        onSelect?.(selectedShift);
        setOpen(false);
      },
      [onSelect],
    );

    const handleClear = useCallback(() => {
      onSelect?.(null);
      setOpen(false);
    }, [onSelect]);

    // Show loading when typing (before debounce) or when actually loading
    const isSearching = loading;

    // Helper function to format shift display names
    const formatShiftDisplayName = useCallback(
      (shift: ShiftEntity) => {
        const openDate = new Date(shift.d_open);
        const closeDate = shift.d_close ? new Date(shift.d_close) : null;

        return {
          title: `${shift.user_open.full_name} - ${openDate.toLocaleDateString()}`,
          subtitle: `${openDate.toLocaleString()} - ${closeDate ? closeDate.toLocaleString() : t("shift.report.open", "Open")}`,
        };
      },
      [t]
    );

    // Memoize filtered and sorted shifts (sort by open date, newest first)
    const sortedShifts = useMemo(() => {
      return [...shifts].sort((a, b) =>
        new Date(b.d_open).getTime() - new Date(a.d_open).getTime()
      );
    }, [shifts]);

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                "w-full justify-between min-h-12 py-3 px-3",
                error && "border-red-500 focus:border-red-500",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              {value ? (
                <div className="flex items-center gap-2 flex-1 min-w-0 py-1">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col items-start flex-1 min-w-0 gap-1">
                    <span className="font-medium text-sm truncate w-full text-left">
                      {formatShiftDisplayName(value).title}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full text-left">
                      {formatShiftDisplayName(value).subtitle}
                    </span>
                  </div>
                  {!disabled && (
                    <X
                      className="h-4 w-4 opacity-50 hover:opacity-100 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground py-1">
                  <Clock className="h-4 w-4" />
                  <span>{placeholderText}</span>
                  {required && <span className="text-red-500 ml-1">*</span>}
                </div>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" side="bottom" align="start">
            <Command shouldFilter={false}>
              <CommandList className="max-h-[300px] overflow-y-auto">
                {loadError ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <X className="h-8 w-8 text-red-500 mb-2" />
                    <span className="text-sm text-red-600 mb-2">
                      {loadError}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadShiftsWithParams()}
                      className="mt-2"
                    >
                      {t("control.retry", "Retry")}
                    </Button>
                  </div>
                ) : isSearching ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      {t("shift.loading_shifts", "Loading shifts...")}
                    </span>
                  </div>
                ) : sortedShifts.length === 0 ? (
                  <CommandEmpty>
                    <div className="flex flex-col items-center p-6 text-center">
                      <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        {emptyText_}
                      </span>
                    </div>
                  </CommandEmpty>
                ) : (
                  <CommandGroup
                    heading={t("shift.available_shifts", "Available Shifts")}
                  >
                    {/* Clear selection option */}
                    {value && (
                      <CommandItem
                        value="__clear__"
                        onSelect={handleClear}
                        className="text-muted-foreground border-b"
                      >
                        <X className="mr-2 h-4 w-4" />
                        {t("shift.clear_selection", "Clear selection")}
                      </CommandItem>
                    )}

                    {/* Shift options */}
                    {sortedShifts.map((shift) => {
                      const displayInfo = formatShiftDisplayName(shift);
                      return (
                        <CommandItem
                          key={shift.id}
                          value={`${shift.user_open.full_name} ${new Date(shift.d_open).toLocaleDateString()}`}
                          onSelect={() => handleSelect(shift)}
                          className="flex items-center p-3"
                        >
                          <Check
                            className={cn(
                              "mr-3 h-4 w-4",
                              value?.id === shift.id
                                ? "opacity-100 text-primary"
                                : "opacity-0",
                            )}
                          />
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {displayInfo.title}
                              </div>
                              <div className="text-xs text-muted-foreground truncate mt-1">
                                {displayInfo.subtitle}
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
    );
  },
);

ShiftSelector.displayName = "SelectShift";
