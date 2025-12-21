"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NetWorthChart } from "@/components/charts/net-worth-chart"
import { format } from "date-fns"
import { RefreshCw } from "lucide-react"
import { useMonthNavigation } from "@/hooks/use-month-navigation"
import { MonthNavigator } from "@/components/layout/month-navigator"
import { YearNavigator } from "@/components/layout/year-navigator"
import { toast } from "sonner"

interface AccountEntry {
  id: string
  name: string
  type: string
  category: string
  categoryId: string
  currentValue: string | null
  hasSnapshot: boolean
}

interface TrendData {
  month: string
  monthNum: number
  assets: number
  debts: number
  netWorth: number
}

interface SummaryData {
  monthsWithData: { month: number; year: number }[]
  years: number[]
}

export default function NetWorthEntryPage() {
  const { currentMonth, goToMonth } = useMonthNavigation()
  const [trendsYear, setTrendsYear] = useState(currentMonth.getFullYear())
  const [activeTab, setActiveTab] = useState("entry")
  const [accounts, setAccounts] = useState<AccountEntry[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [summaryData, setSummaryData] = useState<SummaryData>({ monthsWithData: [], years: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSummaryData = useCallback(async () => {
    try {
      const response = await fetch('/api/net-worth/summary')
      if (response.ok) {
        const data = await response.json()
        setSummaryData(data)
      }
    } catch (error) {
      console.error('Error fetching summary data:', error)
    }
  }, [])

  const fetchNetWorthData = useCallback(async () => {
    setLoading(true)
    try {
      const month = currentMonth.getMonth() + 1
      const year = currentMonth.getFullYear()
      
      const response = await fetch(`/api/net-worth?month=${month}&year=${year}`)
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      }
    } catch (error) {
      console.error('Error fetching net worth data:', error)
      toast.error('Failed to load net worth data')
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  const fetchTrendData = useCallback(async () => {
    try {
      const response = await fetch(`/api/net-worth/trends?year=${trendsYear}`)
      if (response.ok) {
        const data = await response.json()
        setTrendData(data)
      }
    } catch (error) {
      console.error('Error fetching trend data:', error)
      toast.error('Failed to load trend data')
    }
  }, [trendsYear])

  useEffect(() => {
    fetchSummaryData()
  }, [fetchSummaryData])

  useEffect(() => {
    fetchNetWorthData()
  }, [fetchNetWorthData])

  useEffect(() => {
    fetchTrendData()
  }, [fetchTrendData])

  const handleValueChange = (accountId: string, value: string) => {
    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, currentValue: value }
        : account
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const month = currentMonth.getMonth() + 1
      const year = currentMonth.getFullYear()
      
      const snapshots = accounts.map(account => ({
        accountId: account.id,
        value: account.currentValue
      })).filter(snap => snap.value !== null && snap.value !== '')

      const response = await fetch('/api/net-worth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          year,
          snapshots
        })
      })

      if (response.ok) {
        await fetchNetWorthData()
        await fetchSummaryData()
        await fetchTrendData()
        toast.success('Net worth snapshots saved successfully')
      } else {
        const error = await response.json()
        console.error('Error saving net worth:', error.error)
        toast.error('Failed to save net worth snapshots')
      }
    } catch (error) {
      console.error('Error saving net worth:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleMonthClick = (monthNum: number) => {
    const newDate = new Date(trendsYear, monthNum - 1, 1)
    goToMonth(newDate)
    setActiveTab("entry")
  }

  const assets = accounts.filter(a => a.type === 'ASSET').sort((a,b) => a.category.localeCompare(b.category));
  const debts = accounts.filter(a => a.type === 'DEBT').sort((a,b) => a.category.localeCompare(b.category));

  const totalAssets = assets.reduce((sum, a) => {
    const value = parseFloat(a.currentValue || '0')
    return sum + (isNaN(value) ? 0 : value)
  }, 0)

  const totalDebts = debts.reduce((sum, d) => {
    const value = parseFloat(d.currentValue || '0')
    return sum + (isNaN(value) ? 0 : value)
  }, 0)

  const netWorth = totalAssets - totalDebts

  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Net Worth</h1>
          <p className="text-muted-foreground">
            Track your financial progress over time
          </p>
        </div>
        <div className="flex items-center gap-4">
          {activeTab === "entry" ? (
             <MonthNavigator 
             currentMonth={currentMonth} 
             onMonthChange={goToMonth} 
             monthsWithData={summaryData.monthsWithData}
           />
          ) : (
            <YearNavigator 
              currentYear={trendsYear} 
              onYearChange={setTrendsYear} 
              availableYears={summaryData.years}
            />
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="entry">Monthly Entry</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="entry">
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold">
                Entry for {format(currentMonth, 'MMMM yyyy')}
              </h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">Assets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assets.length === 0 ? (
                    <p className="text-muted-foreground">
                      No assets found. <a href="/net-worth/accounts" className="text-blue-600 hover:underline">Add some accounts</a> to get started.
                    </p>
                  ) : (
                    assets.map((account) => (
                      <div key={account.id} className="space-y-2">
                        <Label className="text-sm font-medium">
                          {account.name}
                          <Badge variant="outline" className="ml-2">
                            {account.category}
                          </Badge>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={account.currentValue || ''}
                          onChange={(e) => handleValueChange(account.id, e.target.value)}
                          className={account.hasSnapshot ? 'border-green-500' : ''}
                        />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-700">Debts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {debts.length === 0 ? (
                    <p className="text-muted-foreground">
                      No debts found. <a href="/net-worth/accounts" className="text-blue-600 hover:underline">Add some accounts</a> to get started.
                    </p>
                  ) : (
                    debts.map((account) => (
                      <div key={account.id} className="space-y-2">
                        <Label className="text-sm font-medium">
                          {account.name}
                          <Badge variant="outline" className="ml-2">
                            {account.category}
                          </Badge>
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={account.currentValue || ''}
                          onChange={(e) => handleValueChange(account.id, e.target.value)}
                          className={account.hasSnapshot ? 'border-red-500' : ''}
                        />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total Assets</Label>
                    <div className="text-2xl font-bold text-green-700">
                      ${totalAssets.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total Debts</Label>
                    <div className="text-2xl font-bold text-red-700">
                      ${totalDebts.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Net Worth</Label>
                    <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      ${netWorth.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Net Worth Trends - {trendsYear}</CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.some(d => d.netWorth !== 0) ? (
                <NetWorthChart data={trendData} onMonthClick={handleMonthClick} />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data yet for {trendsYear}. Add account values to see trends.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
