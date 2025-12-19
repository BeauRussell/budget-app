"use client"

import { useState, useEffect } from "react"

export function useMonthNavigation(initialMonth?: Date) {
  const [currentMonth, setCurrentMonth] = useState(
    initialMonth || new Date()
  )

  // On mount, check URL for month parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const monthParam = urlParams.get('month')
      
      if (monthParam) {
        const date = new Date(monthParam + '-01') // Add day to make valid date
        if (!isNaN(date.getTime())) {
          setCurrentMonth(date)
        }
      }
    }
  }, [])

  // Whenever currentMonth changes, update URL
  const goToMonth = (month: Date) => {
    setCurrentMonth(month)
    
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('month', month.toISOString().slice(0, 7)) // YYYY-MM
      window.history.replaceState({}, '', url.toString())
    }
  }

  return {
    currentMonth,
    goToMonth,
  }
}