import * as React from "react";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import { t } from "i18next";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  PlusCircle,
  Search,
  Trash2,
  X,
} from "lucide-react";

interface PageHeaderProps {
  title: string;
  hasActiveFilters?: boolean;
  onShowFilters?: () => void;
  onAdd?: () => void;
  clearFilters: () => void;
  addButtonText?: string;
  showAddButton?: boolean;
  showFilters?: boolean;

  // Bulk delete props
  selectedCount?: number;
  onBulkDelete?: () => void;

  // Sorting props
  showSort?: boolean;
  sortField?: string;
  sortOrder?: 1 | -1;
  sortFields?: Array<{ value: string; label: string }>;
  onSortChange?: (field: string, order: 1 | -1) => void;

  // Search props ✅
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholderKey?: string; // i18n key
  searchDebounceMs?: number; // optional debounce
  onClearSearch?: () => void; // optional
}

function useDebouncedCallback<T extends (...args: any[]) => void>(
  cb: T | undefined,
  delay: number
) {
  const cbRef = React.useRef(cb);
  React.useEffect(() => {
    cbRef.current = cb;
  }, [cb]);

  return React.useMemo(() => {
    let timer: any;
    return (...args: Parameters<T>) => {
      if (!cbRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => cbRef.current?.(...args), delay);
    };
  }, [delay]);
}

export function PageHeader({
  title,
  hasActiveFilters,
  onShowFilters,
  onAdd,
  clearFilters,
  addButtonText = "control.add",
  showAddButton = true,
  showFilters = true,
  selectedCount = 0,
  onBulkDelete,
  showSort = false,
  sortField = "id",
  sortOrder = 1,
  sortFields = [],
  onSortChange,

  // Search defaults ✅
  showSearch = true,
  searchValue = "",
  onSearchChange,
  searchPlaceholderKey = "control.search",
  searchDebounceMs = 0,
  onClearSearch,
}: PageHeaderProps) {
  const [localSearch, setLocalSearch] = React.useState(searchValue);

  // sync if parent changes searchValue
  React.useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  const debouncedSearch = useDebouncedCallback(
    onSearchChange,
    Math.max(0, searchDebounceMs)
  );

  const pushSearch = (value: string) => {
    if (!onSearchChange) return;

    if (searchDebounceMs > 0) debouncedSearch(value);
    else onSearchChange(value);
  };

  const handleSortFieldChange = (field: string) => {
    if (onSortChange) onSortChange(field, sortOrder);
  };

  const handleSortOrderToggle = () => {
    if (onSortChange && sortField) onSortChange(sortField, sortOrder === 1 ? -1 : 1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocalSearch(v);
    pushSearch(v);
  };

  const clearSearch = () => {
    setLocalSearch("");
    if (onClearSearch) onClearSearch();
    pushSearch("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span>{t(title)}</span>

      <div className="flex flex-wrap items-center gap-2">
        {/* Search ✅ */}
        {showSearch && (
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={localSearch}
              onChange={handleSearchChange}
              placeholder={t(searchPlaceholderKey)}
              className="pl-8 pr-9 h-9"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              name="page_header_search__no_autofill"
            />
            {localSearch?.length > 0 && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label={t("control.clear")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {showAddButton && (
          <Button variant="default" size="sm" onClick={onAdd}>
            <PlusCircle className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">{t(addButtonText)}</span>
          </Button>
        )}

        {showFilters && (
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="icon"
            onClick={onShowFilters}
            title={t("control.filters")}
          >
            <Filter className="h-4 w-4" />
          </Button>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFilters}
            title={t("control.clear_filters")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Sort Controls - Hidden on large screens (table has column sorting) */}
        {showSort && sortFields.length > 0 && (
          <div className="flex items-center gap-2 lg:hidden">
            <Select value={sortField} onValueChange={handleSortFieldChange}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortFields.map((field) => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSortOrderToggle}
              title={t(sortOrder === 1 ? "control.ascending" : "control.descending")}
            >
              {sortOrder === 1 ? (
                <ArrowDownAZ className="h-4 w-4" />
              ) : (
                <ArrowUpAZ className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Bulk Delete Button */}
        {onBulkDelete && selectedCount > 0 && (
          <Button variant="destructive" size="sm" onClick={onBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">{t("control.delete")}</span>
            <span>{selectedCount}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
