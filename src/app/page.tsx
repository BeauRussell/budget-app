"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { TrendingUp, TrendingDown, PiggyBank, DollarSign, CreditCard } from "lucide-react"
import Link from "next/link"

interface DashboardData {
  netWorth: {
    totalAssets: number
    totalDebts: number
    netWorth: number
  }
  budget: {
    income: number
    totalBudgeted: number
    totalSpent: number
    plannedSavings: number
    actualSavings: number
    savingsRate: number
  }
}

export default function Dashboard() {
  const currentMonth = useMemo(() => new Date(), [])
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      const month = currentMonth.getMonth() + 1
      const year = currentMonth.getFullYear()
      
      const response = await fetch(`/api/dashboard?month=${month}&year=${year}`)
      if (response.ok) {
        const data = await response.json()
        setData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview for {format(currentMonth, 'MMMM yyyy')}
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(data?.netWorth.netWorth || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ${(data?.netWorth.netWorth || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <Link href="/net-worth" className="hover:underline">View details</Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(data?.budget.income || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <Link href="/budget" className="hover:underline">View budget</Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(data?.budget.totalSpent || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              of ${(data?.budget.totalBudgeted || 0).toLocaleString()} budgeted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(data?.budget.savingsRate || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {(data?.budget.savingsRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              ${(data?.budget.actualSavings || 0).toLocaleString()} saved
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Net Worth Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-700" />
                  <span>Total Assets</span>
                </div>
                <span className="font-bold text-green-700">
                  ${(data?.netWorth.totalAssets || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-700" />
                  <span>Total Debts</span>
                </div>
                <span className="font-bold text-red-700">
                  ${(data?.netWorth.totalDebts || 0).toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-4 flex items-center justify-between">
                <span className="font-semibold">Net Worth</span>
                <span className={`font-bold text-xl ${(data?.netWorth.netWorth || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ${(data?.netWorth.netWorth || 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link href="/net-worth" className="text-sm text-blue-600 hover:underline">
                Manage accounts and track monthly values
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Income</span>
                <span className="font-bold">
                  ${(data?.budget.income || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Budgeted</span>
                <span className="font-bold">
                  ${(data?.budget.totalBudgeted || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Spent</span>
                <span className="font-bold">
                  ${(data?.budget.totalSpent || 0).toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-4 flex items-center justify-between">
                <span className="font-semibold">Planned Savings</span>
                <span className={`font-bold ${(data?.budget.plannedSavings || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ${(data?.budget.plannedSavings || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Actual Savings</span>
                <span className={`font-bold text-xl ${(data?.budget.actualSavings || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ${(data?.budget.actualSavings || 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link href="/budget" className="text-sm text-blue-600 hover:underline">
                Track monthly spending by category
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}