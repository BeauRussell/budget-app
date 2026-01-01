"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LucideIcon, Home, TrendingUp, Wallet, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useSidebar } from "@/contexts/sidebar-context"
import { Button } from "@/components/ui/button"

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  subItems?: { title: string; href: string }[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Net Worth",
    href: "/net-worth",
    icon: TrendingUp,
    subItems: [
      { title: "Overview", href: "/net-worth" },
      { title: "Accounts", href: "/net-worth/accounts" },
      { title: "Account Categories", href: "/net-worth/accounts/categories" },
    ]
  },
  {
    title: "Budget",
    href: "/budget",
    icon: Wallet,
    subItems: [
      { title: "Overview", href: "/budget" },
      { title: "Transactions", href: "/budget/transactions" },
      { title: "Categories", href: "/budget/categories" },
    ]
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isMobileOpen, isDesktopCollapsed, closeMobileSidebar, toggleDesktopSidebar } = useSidebar()

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity",
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeMobileSidebar}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen flex-col border-r bg-gray-50 transition-all duration-300 ease-in-out",
          "md:static md:h-full",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isDesktopCollapsed ? "md:w-16" : "md:w-64",
          !isDesktopCollapsed ? "w-64" : ""
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6 md:px-4">
          <h1
            className={cn(
              "text-xl font-semibold text-gray-900 transition-opacity duration-300",
              isDesktopCollapsed && "md:hidden"
            )}
          >
            Budget Tracker
          </h1>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                closeMobileSidebar()
              } else {
                toggleDesktopSidebar()
              }
            }}
            className="md:flex"
          >
            {typeof window !== "undefined" && window.innerWidth < 768 ? (
              <X className="h-5 w-5" />
            ) : (
              <>
                {isDesktopCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </>
            )}
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const isExpanded = item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => {
                    if (typeof window !== "undefined" && window.innerWidth < 768) {
                      closeMobileSidebar()
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                    isDesktopCollapsed && "md:justify-center"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span
                    className={cn(
                      "transition-opacity duration-300",
                      isDesktopCollapsed && "md:hidden"
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
                {item.subItems && isExpanded && !isDesktopCollapsed && (
                  <div className="ml-9 mt-1 space-y-1">
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => {
                            if (typeof window !== "undefined" && window.innerWidth < 768) {
                              closeMobileSidebar()
                            }
                          }}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            isSubActive
                              ? "bg-primary text-primary-foreground"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          )}
                        >
                          {subItem.title}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
