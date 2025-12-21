"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getYear, getMonth } from "date-fns"

interface MonthPickerProps {
  selectedMonth: Date
  onMonthSelect: (date: Date) => void
  monthsWithData?: { month: number; year: number }[]
}

export function MonthPicker({
  selectedMonth,
  onMonthSelect,
  monthsWithData = [],
}: MonthPickerProps) {
  const [viewYear, setViewYear] = React.useState(getYear(selectedMonth))

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]

  const handlePrevYear = () => setViewYear(prev => prev - 1)
  const handleNextYear = () => setViewYear(prev => prev + 1)

  const handleMonthClick = (monthIndex: number) => {
    const newDate = new Date(viewYear, monthIndex, 1)
    onMonthSelect(newDate)
  }

  const isSelected = (monthIndex: number) => {
    return getYear(selectedMonth) === viewYear && getMonth(selectedMonth) === monthIndex
  }

  const hasData = (monthIndex: number) => {
    return monthsWithData.some(
      (m) => m.month === monthIndex + 1 && m.year === viewYear
    )
  }

  return (
    <div className="p-3 w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={handlePrevYear}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold text-sm">
          {viewYear}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={handleNextYear}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((month, index) => (
          <Button
            key={month}
            variant={isSelected(index) ? "default" : "ghost"}
            className={cn(
              "h-9 w-full font-normal relative",
              isSelected(index) && "font-semibold"
            )}
            onClick={() => handleMonthClick(index)}
          >
            {month}
            {hasData(index) && !isSelected(index) && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
            )}
            {isSelected(index) && (
              <Check className="ml-1 h-3 w-3 absolute top-1 right-1" />
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}
