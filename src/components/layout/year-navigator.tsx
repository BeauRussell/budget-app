"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { useState } from "react"

interface YearNavigatorProps {
  currentYear: number
  onYearChange: (year: number) => void
  availableYears: number[]
  className?: string
}

export function YearNavigator({
  currentYear,
  onYearChange,
  availableYears,
  className
}: YearNavigatorProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const handlePreviousYear = () => {
    onYearChange(currentYear - 1)
  }

  const handleNextYear = () => {
    onYearChange(currentYear + 1)
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousYear}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[100px] justify-between">
            {currentYear}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[150px] p-2">
          <div className="flex flex-col gap-1">
            {availableYears.length > 0 ? (
              availableYears.map((year) => (
                <Button
                  key={year}
                  variant="ghost"
                  className="justify-between font-normal"
                  onClick={() => {
                    onYearChange(year)
                    setIsPopoverOpen(false)
                  }}
                >
                  {year}
                  {year === currentYear && <Check className="h-4 w-4" />}
                </Button>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No data available
              </div>
            )}
            {!availableYears.includes(new Date().getFullYear()) && (
               <Button
               variant="ghost"
               className="justify-between font-normal"
               onClick={() => {
                 onYearChange(new Date().getFullYear())
                 setIsPopoverOpen(false)
               }}
             >
               {new Date().getFullYear()}
               {new Date().getFullYear() === currentYear && <Check className="h-4 w-4" />}
             </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNextYear}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
