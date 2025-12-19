"use client"

import { useState } from "react"
import { format, addMonths, subMonths } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MonthNavigatorProps {
  currentMonth: Date
  onMonthChange: (month: Date) => void
  className?: string
}

export function MonthNavigator({ 
  currentMonth, 
  onMonthChange, 
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
            initialFocus
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