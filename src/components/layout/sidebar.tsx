"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LucideIcon, Home, TrendingUp, Wallet } from "lucide-react"

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

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Budget Tracker
        </h1>
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
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
              {item.subItems && isExpanded && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.subItems.map((subItem) => {
                    const isSubActive = pathname === subItem.href
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
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
    </div>
  )
}
