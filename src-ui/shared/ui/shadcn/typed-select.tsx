import * as React from "react";
import { Check, X } from "lucide-react";
import * as SelectPrimitive from "@radix-ui/react-select";

import { cn } from "@/shared/lib/utils";
import { Button } from "./button";
import { Badge } from "./badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

// Generic interface for options
interface Option<T> {
  value: T;
  label: string;
}

interface TypedSelectProps<T> {
  value: T | null | undefined;
  onChange: (value: T | null) => void;
  options: Option<T>[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  renderOption?: (option: Option<T>) => React.ReactNode;
  allowClear?: boolean;
  nullText?: string;
  compareValues?: (a: T | null | undefined, b: T) => boolean;
}

export function TypedSelect<T>({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className,
  disabled = false,
  renderOption,
  allowClear = false,
  nullText = "None",
  compareValues = (a, b) => a === b,
}: TypedSelectProps<T>) {
  // Generate a unique ID for each option to use as the value in the select
  const optionsWithIds = React.useMemo(() => {
    return options.map((opt, index) => ({
      ...opt,
      _id: `option-${index}`,
    }));
  }, [options]);

  // Find the currently selected option
  const selectedOption = React.useMemo(() => {
    if (value === null || value === undefined) return null;
    return optionsWithIds.find((opt) => compareValues(value, opt.value));
  }, [value, optionsWithIds, compareValues]);

  // Handle selection change
  const handleSelectionChange = React.useCallback(
    (selectedId: string) => {
      if (selectedId === "__clear__") {
        onChange(null);
      } else {
        const selected = optionsWithIds.find((opt) => opt._id === selectedId);
        if (selected) {
          onChange(selected.value);
        }
      }
    },
    [optionsWithIds, onChange],
  );

  return (
    <Select
      value={selectedOption?._id || (allowClear ? "__clear__" : undefined)}
      onValueChange={handleSelectionChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder}>
          {selectedOption &&
            (renderOption
              ? renderOption(selectedOption)
              : selectedOption.label)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {allowClear && <SelectItem value="__clear__">{nullText}</SelectItem>}
        {optionsWithIds.map((option) => (
          <SelectItem key={option._id} value={option._id}>
            {renderOption ? renderOption(option) : option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface TypedMultiSelectProps<T> {
  values: T[];
  onChange: (values: T[]) => void;
  options: Option<T>[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  renderOption?: (option: Option<T>) => React.ReactNode;
  compareValues?: (a: T, b: T) => boolean;
}

export function TypedMultiSelect<T>({
  values = [],
  onChange,
  options,
  placeholder = "Select options",
  className,
  disabled = false,
  renderOption,
  compareValues = (a, b) => a === b,
}: TypedMultiSelectProps<T>) {
  const [selectedValues, setSelectedValues] = React.useState<T[]>(values);

  // Update internal state when external values change
  React.useEffect(() => {
    setSelectedValues(values);
  }, [values]);

  // Find the selected options for display
  const selectedOptions = React.useMemo(() => {
    return options.filter((option) =>
      selectedValues.some((value) => compareValues(value, option.value)),
    );
  }, [selectedValues, options, compareValues]);

  const handleToggle = React.useCallback(
    (option: Option<T>) => {
      let newValues: T[];

      if (selectedValues.some((value) => compareValues(value, option.value))) {
        // Remove if already selected
        newValues = selectedValues.filter(
          (value) => !compareValues(value, option.value),
        );
      } else {
        // Add if not selected
        newValues = [...selectedValues, option.value];
      }

      setSelectedValues(newValues);
      onChange(newValues);
    },
    [selectedValues, onChange, compareValues],
  );

  return (
    <div
      className={cn(
        "relative w-full border rounded-md px-3 py-2 min-h-10",
        !selectedValues.length && "text-muted-foreground",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <div className="flex flex-wrap gap-1 items-center">
        {!selectedOptions.length && placeholder}
        {selectedOptions.map((option, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="rounded-sm px-1 py-0.5 font-normal"
          >
            {renderOption ? renderOption(option) : option.label}
            {!disabled && (
              <button
                type="button"
                className="ml-1 rounded-full outline-none hover:bg-secondary-foreground/20"
                onClick={() => handleToggle(option)}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {!disabled && (
        <div className="absolute right-1 top-1 z-10">
          <SelectPrimitive.Root>
            <SelectPrimitive.Trigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">Open</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </Button>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content
                className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80"
                position="popper"
                sideOffset={5}
              >
                <SelectPrimitive.Viewport className="p-1">
                  {options.map((option, index) => (
                    <SelectPrimitive.Item
                      key={index}
                      value={index.toString()}
                      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onSelect={(event) => {
                        event.preventDefault();
                        handleToggle(option);
                      }}
                    >
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        <SelectPrimitive.ItemIndicator>
                          <Check className="h-4 w-4" />
                        </SelectPrimitive.ItemIndicator>
                      </span>
                      <SelectPrimitive.ItemText>
                        {renderOption ? renderOption(option) : option.label}
                      </SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        </div>
      )}
    </div>
  );
}
