"use client"

import { useState } from "react"

export function useMonthNavigation(initialMonth?: Date) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Initialize from URL if possible
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const monthParam = urlParams.get('month')
      
      if (monthParam) {
        const date = new Date(monthParam + '-01') // Add day to make valid date
        if (!isNaN(date.getTime())) {
          return date
        }
      }
    }
    return initialMonth || new Date()
  })

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