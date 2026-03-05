import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/shadcn/button";
import { Calendar } from "@/shared/ui/shadcn/calendar";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  value?: {
    from?: string | Date;
    to?: string | Date;
  };
  onChange?: (range: { from?: string; to?: string } | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  dateFormat?: string;
  includeTime?: boolean; // New prop to enable time selection
  minDate?: Date;
  maxDate?: Date;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  disabled = false,
  className,
  dateFormat = "yyyy-MM-dd",
  includeTime = false,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  // Time state for from and to dates
  const [fromTime, setFromTime] = React.useState({
    hours: "00",
    minutes: "00",
  });
  const [toTime, setToTime] = React.useState({ hours: "23", minutes: "59" });

  // Convert string values to Date objects for Calendar component
  const dateRange = React.useMemo((): DateRange | undefined => {
    if (!value) return undefined;

    const from = value.from
      ? value.from instanceof Date
        ? value.from
        : new Date(value.from)
      : undefined;
    const to = value.to
      ? value.to instanceof Date
        ? value.to
        : new Date(value.to)
      : undefined;

    // Validate dates
    const validFrom = from && !isNaN(from.getTime()) ? from : undefined;
    const validTo = to && !isNaN(to.getTime()) ? to : undefined;

    if (!validFrom && !validTo) return undefined;

    return {
      from: validFrom,
      to: validTo,
    };
  }, [value]);

  // Update time states when value changes
  React.useEffect(() => {
    if (includeTime && value) {
      if (value.from) {
        const fromDate =
          value.from instanceof Date ? value.from : new Date(value.from);
        if (!isNaN(fromDate.getTime())) {
          setFromTime({
            hours: fromDate.getHours().toString().padStart(2, "0"),
            minutes: fromDate.getMinutes().toString().padStart(2, "0"),
          });
        }
      }
      if (value.to) {
        const toDate = value.to instanceof Date ? value.to : new Date(value.to);
        if (!isNaN(toDate.getTime())) {
          setToTime({
            hours: toDate.getHours().toString().padStart(2, "0"),
            minutes: toDate.getMinutes().toString().padStart(2, "0"),
          });
        }
      }
    }
  }, [value, includeTime]);

  const combineDateAndTime = (
    date: Date,
    time: { hours: string; minutes: string }
  ) => {
    const combined = new Date(date);
    combined.setHours(parseInt(time.hours, 10));
    combined.setMinutes(parseInt(time.minutes, 10));
    combined.setSeconds(0);
    combined.setMilliseconds(0);
    return combined;
  };

  const handleDateRangeSelect = (selectedRange: DateRange | undefined) => {
    if (!onChange) return;

    if (!selectedRange) {
      onChange(undefined);
      return;
    }

    let fromDate = selectedRange.from;
    let toDate = selectedRange.to;

    // If includeTime is enabled, combine with time values
    if (includeTime) {
      if (fromDate) {
        fromDate = combineDateAndTime(fromDate, fromTime);
      }
      if (toDate) {
        toDate = combineDateAndTime(toDate, toTime);
      }
    }

    const formatString = includeTime ? "yyyy-MM-dd'T'HH:mm:ss" : dateFormat;
    const formattedRange = {
      from: fromDate ? format(fromDate, formatString) : undefined,
      to: toDate ? format(toDate, formatString) : undefined,
    };

    onChange(formattedRange);
  };

  const handleTimeChange = (
    type: "from" | "to",
    field: "hours" | "minutes",
    value: string
  ) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    // Validate time values
    if (field === "hours" && (numValue < 0 || numValue > 23)) return;
    if (field === "minutes" && (numValue < 0 || numValue > 59)) return;

    const paddedValue = numValue.toString().padStart(2, "0");

    if (type === "from") {
      const newFromTime = { ...fromTime, [field]: paddedValue };
      setFromTime(newFromTime);

      // Update the date range if we have a from date
      if (dateRange?.from) {
        const updatedFromDate = combineDateAndTime(dateRange.from, newFromTime);
        const formattedRange = {
          from: format(updatedFromDate, "yyyy-MM-dd'T'HH:mm:ss"),
          to: dateRange.to
            ? format(
                includeTime
                  ? combineDateAndTime(dateRange.to, toTime)
                  : dateRange.to,
                includeTime ? "yyyy-MM-dd'T'HH:mm:ss" : dateFormat
              )
            : undefined,
        };
        onChange?.(formattedRange);
      }
    } else {
      const newToTime = { ...toTime, [field]: paddedValue };
      setToTime(newToTime);

      // Update the date range if we have a to date
      if (dateRange?.to) {
        const updatedToDate = combineDateAndTime(dateRange.to, newToTime);
        const formattedRange = {
          from: dateRange.from
            ? format(
                includeTime
                  ? combineDateAndTime(dateRange.from, fromTime)
                  : dateRange.from,
                includeTime ? "yyyy-MM-dd'T'HH:mm:ss" : dateFormat
              )
            : undefined,
          to: format(updatedToDate, "yyyy-MM-dd'T'HH:mm:ss"),
        };
        onChange?.(formattedRange);
      }
    }
  };

  const displayFormat = includeTime
    ? "yyyy.MM.dd HH:mm"
    : dateFormat === "yyyy-MM-dd"
    ? "yyyy.MM.dd"
    : dateFormat;

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, displayFormat)} -{" "}
                  {format(dateRange.to, displayFormat)}
                </>
              ) : (
                format(dateRange.from, displayFormat)
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
              disabled={date => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
            />

            {/* Time selection section */}
            {includeTime && (
              <div className="border-t p-4 space-y-4">
                <div className="text-sm font-medium text-center">
                  Select Time Range
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* From Time */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      From Time
                    </Label>
                    <div className="flex gap-1 items-center">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={fromTime.hours}
                        onChange={e =>
                          handleTimeChange("from", "hours", e.target.value)
                        }
                        className="w-16 text-center text-sm"
                        placeholder="HH"
                      />
                      <span className="text-sm">:</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={fromTime.minutes}
                        onChange={e =>
                          handleTimeChange("from", "minutes", e.target.value)
                        }
                        className="w-16 text-center text-sm"
                        placeholder="MM"
                      />
                    </div>
                  </div>

                  {/* To Time */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      To Time
                    </Label>
                    <div className="flex gap-1 items-center">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={toTime.hours}
                        onChange={e =>
                          handleTimeChange("to", "hours", e.target.value)
                        }
                        className="w-16 text-center text-sm"
                        placeholder="HH"
                      />
                      <span className="text-sm">:</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={toTime.minutes}
                        onChange={e =>
                          handleTimeChange("to", "minutes", e.target.value)
                        }
                        className="w-16 text-center text-sm"
                        placeholder="MM"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick time preset buttons */}
                <div className="flex gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFromTime({ hours: "00", minutes: "00" });
                      setToTime({ hours: "23", minutes: "59" });
                      // Trigger update if we have dates selected
                      if (dateRange?.from && dateRange?.to) {
                        const formattedRange = {
                          from: format(
                            combineDateAndTime(dateRange.from, {
                              hours: "00",
                              minutes: "00",
                            }),
                            "yyyy-MM-dd'T'HH:mm:ss"
                          ),
                          to: format(
                            combineDateAndTime(dateRange.to, {
                              hours: "23",
                              minutes: "59",
                            }),
                            "yyyy-MM-dd'T'HH:mm:ss"
                          ),
                        };
                        onChange?.(formattedRange);
                      }
                    }}
                    className="text-xs"
                  >
                    Full Day
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFromTime({ hours: "06", minutes: "00" });
                      setToTime({ hours: "22", minutes: "00" });
                      // Trigger update if we have dates selected
                      if (dateRange?.from && dateRange?.to) {
                        const formattedRange = {
                          from: format(
                            combineDateAndTime(dateRange.from, {
                              hours: "06",
                              minutes: "00",
                            }),
                            "yyyy-MM-dd'T'HH:mm:ss"
                          ),
                          to: format(
                            combineDateAndTime(dateRange.to, {
                              hours: "22",
                              minutes: "00",
                            }),
                            "yyyy-MM-dd'T'HH:mm:ss"
                          ),
                        };
                        onChange?.(formattedRange);
                      }
                    }}
                    className="text-xs"
                  >
                    Work Hours
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
