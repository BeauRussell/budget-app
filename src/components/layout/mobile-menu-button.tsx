"use client"

import { useSidebar } from "@/contexts/sidebar-context"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileMenuButton() {
  const { toggleMobileSidebar } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleMobileSidebar}
      className="flex items-center gap-2"
    >
      <Menu className="h-5 w-5" />
      <span>Menu</span>
    </Button>
  )
}
