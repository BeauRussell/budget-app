"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface SidebarContextType {
  isMobileOpen: boolean
  isDesktopCollapsed: boolean
  toggleMobileSidebar: () => void
  closeMobileSidebar: () => void
  toggleDesktopSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)

  const toggleMobileSidebar = () => setIsMobileOpen((prev) => !prev)
  const closeMobileSidebar = () => setIsMobileOpen(false)
  const toggleDesktopSidebar = () => setIsDesktopCollapsed((prev) => !prev)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMobileSidebar()
      }
    }

    if (isMobileOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isMobileOpen])

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobileOpen])

  return (
    <SidebarContext.Provider
      value={{
        isMobileOpen,
        isDesktopCollapsed,
        toggleMobileSidebar,
        closeMobileSidebar,
        toggleDesktopSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
