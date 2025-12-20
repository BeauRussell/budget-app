"use client"

import { useState } from "react"
import { format, addMonths, subMonths } from "date-fns"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MonthNavigatorProps {
  currentMonth: Date
  onMonthChange: (month: Date) => void
  monthsWithData?: { month: number; year: number }[]
  className?: string
}

export function MonthNavigator({ 
  currentMonth, 
  onMonthChange,
  monthsWithData = [],
  className 
}: MonthNavigatorProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const handlePreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1)
    onMonthChange(newMonth)
  }

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1)
    onMonthChange(newMonth)
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onMonthChange(date)
      setIsPopoverOpen(false)
    }
  }

  // Modifiers for the calendar
  const modifiers = {
    hasData: (date: Date) => {
      // Only mark the first day of the month to keep it clean
      return date.getDate() === 1 && monthsWithData.some(
        (m) => m.month === date.getMonth() + 1 && m.year === date.getFullYear()
      )
    },
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousMonth}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[150px] justify-start">
            {format(currentMonth, "MMMM yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={currentMonth}
            onSelect={handleCalendarSelect}
            modifiers={modifiers}
            modifiersClassNames={{
              hasData: "after:content-['•'] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:text-blue-500 after:text-lg"
            }}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNextMonth}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
