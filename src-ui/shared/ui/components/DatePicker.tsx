import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/shadcn/button"
import { Calendar } from "@/shared/ui/shadcn/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/shadcn/popover"

interface DatePickerProps {
  value?: string | Date
  onChange?: (date: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  dateFormat?: string
  minDate?: Date
  maxDate?: Date
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  dateFormat = "yyyy-MM-dd",
  minDate,
  maxDate
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Convert string value to Date object for Calendar component
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    if (typeof value === 'string') {
      const parsed = new Date(value)
      return isNaN(parsed.getTime()) ? undefined : parsed
    }
    return undefined
  }, [value])

  const handleDateSelect = (selectedDate: Date | undefined) => {

    if (!onChange) return

    if (!selectedDate) {
      onChange(undefined)
      setOpen(false)
      return
    }

    // Format the date as ISO string (YYYY-MM-DD) for backend compatibility
    const formattedDate = format(selectedDate, dateFormat)
    onChange(formattedDate)
    setOpen(false) // Close popover after selection
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
  }

  const displayFormat = dateFormat === "yyyy-MM-dd" ? "PPP" : dateFormat

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? (
            format(dateValue, displayFormat)
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleDateSelect}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
