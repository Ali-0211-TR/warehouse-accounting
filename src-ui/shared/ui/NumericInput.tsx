import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import { t } from "i18next";
import { Calculator } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

// Numpad component for touch input
export const Numpad = memo(
  ({
    onNumberClick,
    onClear,
    onBackspace,
    onEnter,
  }: {
    onNumberClick: (num: string) => void;
    onClear: () => void;
    onBackspace: () => void;
    onEnter: () => void;
  }) => {
    const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

    return (
      <div className="grid grid-cols-3 gap-2 p-2 border rounded-lg shadow-lg min-w-[200px">
        {/* Numbers 1-9 */}
        {numbers.slice(0, 9).map(num => (
          <Button
            key={num}
            variant="outline"
            size="sm"
            className="h-12 text-lg font-medium"
            onClick={() => onNumberClick(num)}
          >
            {num}
          </Button>
        ))}

        {/* Bottom row: 000, 0, . */}
        <Button
          variant="outline"
          size="sm"
          className="h-12 text-sm font-medium"
          onClick={() => onNumberClick("000")}
        >
          000
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-12 text-lg font-medium"
          onClick={() => onNumberClick("0")}
        >
          0
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-12 text-lg font-medium"
          onClick={() => onNumberClick(".")}
        >
          .
        </Button>

        {/* Bottom row: Backspace and Clear */}
        <Button
          variant="outline"
          size="sm"
          className="h-12 text-sm font-medium"
          onClick={onBackspace}
        >
          ←
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-12 text-sm font-medium text-red-600"
          onClick={onClear}
        >
          {t("control.clear", "C")}
        </Button>

        {/* Enter button */}
        <Button
          variant="default"
          size="sm"
          className="h-12 text-lg font-medium bg-green-600 hover:bg-green-700"
          onClick={onEnter}
        >
          {t("control.enter", "✓")}
        </Button>
      </div>
    );
  }
);

Numpad.displayName = "Numpad";

// Enhanced numeric input component with Enter key support and numpad
export const NumericInput = memo(
  ({
    value,
    onChange,
    onEnterPress,
    readOnly = false,
    suffix = "",
    placeholder = "",
    className = "",
    showNumpadButton = true,
  }: {
    value: number;
    onChange?: (value: number) => void;
    onEnterPress?: () => void;
    readOnly?: boolean;
    suffix?: string;
    placeholder?: string;
    className?: string;
    showNumpadButton?: boolean;
  }) => {
    const [displayValue, setDisplayValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [showNumpad, setShowNumpad] = useState(false);
    const [lastTypedValue, setLastTypedValue] = useState<number>(0);
    const lastPropValue = useRef(value);

    // Format number with thousand separators (using space as separator for consistency)
    const formatNumber = useCallback((num: number): string => {
      if (num === 0) return "";
      // Use space as thousand separator for consistency across platforms
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }, []);

    // Only update display value when prop value actually changes
    useEffect(() => {
      if (lastPropValue.current !== value) {
        lastPropValue.current = value;
        // Always clear display value if prop value becomes zero, even if focused
        if (value === 0) {
          setDisplayValue("");
          setLastTypedValue(0); // Reset last typed value when prop becomes 0
        } else if (!isFocused) {
          setDisplayValue(formatNumber(value));
        }
      }
    }, [value, isFocused, suffix, formatNumber]);

    // Initialize display value on mount
    useEffect(() => {
      setDisplayValue(formatNumber(value));
      lastPropValue.current = value;
    }, [formatNumber]); // Run when formatNumber changes

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && onEnterPress) {
          e.preventDefault();
          onEnterPress();
        }
      },
      [onEnterPress]
    );

    const updateValue = useCallback(
      (newValue: string) => {
        setDisplayValue(newValue);

        // Remove all spaces (thousand separators) and extract numeric value
        // Replace comma with period for JavaScript number parsing
        const normalizedValue = newValue.replace(/\s/g, "").replace(/,/g, ".");
        const cleanValue = normalizedValue.replace(/[^\d.]/g, "");

        // Ensure only one decimal point
        const parts = cleanValue.split(".");
        const formattedValue =
          parts.length > 2
            ? parts[0] + "." + parts.slice(1).join("")
            : cleanValue;

        const parsedValue =
          formattedValue === "" || formattedValue === "."
            ? 0
            : Number(formattedValue);

        // Track the last typed value
        setLastTypedValue(parsedValue);

        if (onChange) {
          onChange(parsedValue);
        }
      },
      [onChange]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        updateValue(e.target.value);
      },
      [updateValue]
    );

    const handleFocus = useCallback(() => {
      if (readOnly) return;
      setIsFocused(true);
      // Convert formatted value to unformatted for easier editing
      // Remove spaces used as thousand separators
      if (displayValue.includes(" ")) {
        setDisplayValue(value === 0 ? "" : value.toString());
      }
    }, [value, displayValue, readOnly]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      // If display is empty, keep it empty; otherwise use last typed value or prop value
      if (displayValue === "") {
        setDisplayValue("");
      } else {
        const valueToDisplay = lastTypedValue > 0 ? lastTypedValue : value;
        setDisplayValue(formatNumber(valueToDisplay));
      }
    }, [lastTypedValue, value, displayValue, formatNumber]);

    // Numpad handlers
    const handleNumpadClick = useCallback(
      (num: string) => {
        const newValue = displayValue + num;
        updateValue(newValue);
      },
      [displayValue, updateValue]
    );

    const handleClear = useCallback(() => {
      // Clear the display and explicitly set value to 0 to reset
      setDisplayValue("");
      setLastTypedValue(0);

      // Explicitly call onChange with 0 to ensure parent is notified
      if (onChange) {
        onChange(0);
      }
    }, [onChange]);

    const handleBackspace = useCallback(() => {
      const newValue = displayValue.slice(0, -1);
      updateValue(newValue);
    }, [displayValue, updateValue]);

    const handleNumpadEnter = useCallback(() => {
      setShowNumpad(false);
      if (onEnterPress) {
        onEnterPress();
      }
    }, [onEnterPress]);

    const toggleNumpad = useCallback(() => {
      if (!readOnly) {
        setShowNumpad(prev => !prev);
      }
    }, [readOnly]);

    return (
      <div className={`w-full
    min-w-0
    max-w-full
    text-sm
    sm:text-base ${className}`}>
        <Popover open={showNumpad} onOpenChange={setShowNumpad}>
          <PopoverTrigger asChild>
            <div className="relative w-full">
              <Input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                readOnly={readOnly}
                placeholder={placeholder}
                className={`pr-10 text-lg ${
                  readOnly ? "bg-muted text-muted-foreground" : ""
                }`}
              />

              {/* Calculator button */}
              {!readOnly && showNumpadButton && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-blue-100"
                  onClick={toggleNumpad}
                >
                  <Calculator className="h-4 w-4 text-blue-600" />
                </Button>
              )}

              {/* Suffix text */}
              {suffix && (
                <span
                  className={`absolute top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground pointer-events-none ${
                    !readOnly && showNumpadButton ? "right-10" : "right-3"
                  }`}
                >
                  {suffix}
                </span>
              )}
            </div>
          </PopoverTrigger>

          {!readOnly && showNumpadButton && (
            <PopoverContent
              className="w-auto p-0"
              align="center"
              onOpenAutoFocus={e => e.preventDefault()}
            >
              <Numpad
                onNumberClick={handleNumpadClick}
                onClear={handleClear}
                onBackspace={handleBackspace}
                onEnter={handleNumpadEnter}
              />
            </PopoverContent>
          )}
        </Popover>
      </div>
    );
  }
);

NumericInput.displayName = "NumericInput";
