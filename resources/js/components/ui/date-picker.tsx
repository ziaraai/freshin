"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  selected,
  onSelect,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
}: DatePickerProps) {
  const [date, setDate] = React.useState<string>(selected ? format(selected, 'yyyy-MM-dd') : '');
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    
    if (e.target.value) {
      const newDate = new Date(e.target.value);
      if (onSelect) onSelect(newDate);
      if (onChange) onChange(newDate);
    } else {
      if (onSelect) onSelect(undefined);
      if (onChange) onChange(undefined);
    }
  };
  
  React.useEffect(() => {
    if (selected) {
      setDate(format(selected, 'yyyy-MM-dd'));
    } else {
      setDate('');
    }
  }, [selected]);

  return (
    <div className="relative">
      <Input
        type="date"
        value={date}
        onChange={handleDateChange}
        className={cn(
          "w-[240px] h-8 text-sm cursor-pointer relative ltr:pl-9 rtl:pr-9 [&::-webkit-calendar-picker-indicator]:order-first [&::-webkit-calendar-picker-indicator]:absolute ltr:[&::-webkit-calendar-picker-indicator]:left-2.5 rtl:[&::-webkit-calendar-picker-indicator]:right-2.5 [&::-webkit-calendar-picker-indicator]:my-auto [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer",
          className
        )}
        disabled={disabled}
      />
    </div>
  )
}