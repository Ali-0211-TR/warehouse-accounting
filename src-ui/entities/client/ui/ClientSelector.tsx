import { useDebounce } from "@/shared/hooks/use-debounce";
import { Check, ChevronsUpDown, Loader2, User, X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/shadcn/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import { useCallback, useEffect, useMemo } from "react";
import { useClientStore } from "../model/store";
import { ClientEntity } from "../model/types";

type SelectClientProps = {
  value?: ClientEntity | null;
  onSelect?: (client: ClientEntity | null) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
};

export const ClientSelector = React.memo(
  ({
    value,
    onSelect,
    placeholder,
    emptyText,
    className,
    disabled = false,
    required = false,
    error,
  }: SelectClientProps) => {
    const { t } = useTranslation();
    const { clients, loadClients, loading } = useClientStore();
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [loadError, setLoadError] = React.useState<string | null>(null);

    // Use translations with fallbacks
    const placeholderText =
      placeholder || t("client.select_client", "Select client...");
    const emptyText_ =
      emptyText || t("client.no_client_found", "No client found.");

    // Debounce search query to avoid too many API calls (300ms delay - reduced for better UX)
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Memoize load clients function to prevent unnecessary re-renders
    const loadClientsWithParams = useCallback(
      async (search: string = "") => {
        try {
          setLoadError(null);
          await loadClients({
            filters: {
              search: search.trim(),
              client_type: undefined,
              has_tax_code: undefined,
            },
            first: 0,
            rows: 50,
          });
        } catch (error) {
          console.error("Failed to load clients:", error);
          setLoadError(t("client.loading_error", "Failed to load clients"));
        }
      },
      [loadClients, t],
    );

    // Load clients when popover opens (initial load)
    useEffect(() => {
      if (open && clients.length === 0) {
        loadClientsWithParams();
      }
    }, [open, clients.length, loadClientsWithParams]);

    // Search clients when debounced search query changes
    useEffect(() => {
      if (!open) return;
      loadClientsWithParams(debouncedSearchQuery);
    }, [debouncedSearchQuery, open, loadClientsWithParams]);

    const handleSelect = useCallback(
      (selectedClient: ClientEntity) => {
        onSelect?.(selectedClient);
        setOpen(false);
        setSearchQuery("");
      },
      [onSelect],
    );

    const handleClear = useCallback(() => {
      onSelect?.(null);
      setOpen(false);
      setSearchQuery("");
    }, [onSelect]);

    // Show loading when typing (before debounce) or when actually loading
    const isSearching =
      loading ||
      (searchQuery !== debouncedSearchQuery && searchQuery.trim() !== "");

    // Memoize client type badge
    const getClientTypeBadge = useCallback(
      (clientType: string) => {
        const typeMap: Record<string, string> = {
          Individual: t("client.type.individual", "Individual"),
          Company: t("client.type.company", "Company"),
          Organization: t("client.type.organization", "Organization"),
        };
        return typeMap[clientType] || clientType;
      },
      [t],
    );

    // Memoize filtered and sorted clients
    const processedClients = useMemo(() => {
      return [...clients].sort((a, b) => a.name.localeCompare(b.name));
    }, [clients]);

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
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col items-start flex-1 min-w-0 gap-1">
                    <span className="font-medium text-sm truncate w-full text-left">
                      {value.name}
                    </span>
                    {(value.name_short || value.client_type) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {value.name_short && (
                          <span className="truncate">{value.name_short}</span>
                        )}
                        {value.client_type && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1 py-0"
                          >
                            {getClientTypeBadge(value.client_type)}
                          </Badge>
                        )}
                      </div>
                    )}
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
                  <User className="h-4 w-4" />
                  <span>{placeholderText}</span>
                  {required && <span className="text-red-500 ml-1">*</span>}
                </div>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" side="bottom" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={t("client.search_clients", "Search clients...")}
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="h-9"
              />
              <CommandList>
                {loadError ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <X className="h-8 w-8 text-red-500 mb-2" />
                    <span className="text-sm text-red-600 mb-2">
                      {loadError}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        loadClientsWithParams(debouncedSearchQuery)
                      }
                      className="mt-2"
                    >
                      {t("control.retry", "Retry")}
                    </Button>
                  </div>
                ) : isSearching ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      {searchQuery
                        ? t("client.searching", "Searching...")
                        : t("client.loading_clients", "Loading clients...")}
                    </span>
                  </div>
                ) : processedClients.length === 0 ? (
                  <CommandEmpty>
                    <div className="flex flex-col items-center p-6 text-center">
                      <User className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        {searchQuery
                          ? t(
                              "client.no_clients_found_for",
                              'No clients found for "{{query}}"',
                              { query: searchQuery },
                            )
                          : emptyText_}
                      </span>
                    </div>
                  </CommandEmpty>
                ) : (
                  <CommandGroup
                    heading={t("client.available_clients", "Available Clients")}
                  >
                    {/* Clear selection option */}
                    {value && (
                      <CommandItem
                        value="__clear__"
                        onSelect={handleClear}
                        className="text-muted-foreground border-b"
                      >
                        <X className="mr-2 h-4 w-4" />
                        {t("client.clear_selection", "Clear selection")}
                      </CommandItem>
                    )}

                    {/* Client options */}
                    {processedClients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={`${client.name} ${client.name_short || ""} ${client.document_code || ""}`}
                        onSelect={() => handleSelect(client)}
                        className="flex items-center p-3"
                      >
                        <Check
                          className={cn(
                            "mr-3 h-4 w-4",
                            value?.id === client.id
                              ? "opacity-100 text-primary"
                              : "opacity-0",
                          )}
                        />
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {client.name}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1 text-xs text-muted-foreground">
                              {client.name_short && (
                                <span className="truncate">
                                  {client.name_short}
                                </span>
                              )}
                              {client.document_code && (
                                <span>• {client.document_code}</span>
                              )}
                              {client.contact && (
                                <span>• {client.contact}</span>
                              )}
                            </div>
                            {client.client_type && (
                              <Badge
                                variant="outline"
                                className="text-xs mt-1 px-1"
                              >
                                {getClientTypeBadge(client.client_type)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
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

ClientSelector.displayName = "SelectClient";
