"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BudgetChart, SavingsChart } from "@/components/charts/budget-chart"
import { format } from "date-fns"
import { RefreshCw } from "lucide-react"

interface BudgetEntry {
  id: string
  name: string
  budgeted: string
  spent: string
  hasEntry: boolean
}

interface IncomeData {
  amount: string | null
  note: string | null
}

interface TrendData {
  month: string
  monthNum: number
  budgeted: number
  spent: number
  income: number
  savings: number
}

export default function BudgetEntryPage() {
  const currentMonth = useMemo(() => new Date(), [])
  const [entries, setEntries] = useState<BudgetEntry[]>([])
  const [income, setIncome] = useState<IncomeData>({ amount: null, note: null })
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchBudgetData = useCallback(async () => {
    setLoading(true)
    try {
      const month = currentMonth.getMonth() + 1
      const year = currentMonth.getFullYear()
      
      const [budgetRes, incomeRes] = await Promise.all([
        fetch(`/api/budget?month=${month}&year=${year}`),
        fetch(`/api/income?month=${month}&year=${year}`)
      ])

      if (budgetRes.ok) {
        const data = await budgetRes.json()
        setEntries(data)
      }

      if (incomeRes.ok) {
        const data = await incomeRes.json()
        setIncome({
          amount: data.amount?.toString() || '',
          note: data.note || ''
        })
      }
    } catch (error) {
      console.error('Error fetching budget data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  const fetchTrendData = useCallback(async () => {
    try {
      const year = currentMonth.getFullYear()
      const response = await fetch(`/api/budget/trends?year=${year}`)
      if (response.ok) {
        const data = await response.json()
        setTrendData(data)
      }
    } catch (error) {
      console.error('Error fetching trend data:', error)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchBudgetData()
    fetchTrendData()
  }, [fetchBudgetData, fetchTrendData])

  const handleBudgetedChange = (categoryId: string, value: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === categoryId 
        ? { ...entry, budgeted: value }
        : entry
    ))
  }

  const handleSpentChange = (categoryId: string, value: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === categoryId 
        ? { ...entry, spent: value }
        : entry
    ))
  }

  const handleIncomeChange = (value: string) => {
    setIncome(prev => ({ ...prev, amount: value }))
  }

  const handleNoteChange = (value: string) => {
    setIncome(prev => ({ ...prev, note: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const month = currentMonth.getMonth() + 1
      const year = currentMonth.getFullYear()
      
      // Save budget entries
      const budgetData = entries.map(entry => ({
        categoryId: entry.id,
        budgeted: entry.budgeted,
        spent: entry.spent
      }))

      const [budgetRes, incomeRes] = await Promise.all([
        fetch('/api/budget', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month, year, entries: budgetData })
        }),
        fetch('/api/income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            month, 
            year, 
            amount: income.amount || 0,
            note: income.note
          })
        })
      ])

      if (budgetRes.ok && incomeRes.ok) {
        await fetchBudgetData()
      } else {
        console.error('Error saving budget data')
      }
    } catch (error) {
      console.error('Error saving budget data:', error)
    } finally {
      setSaving(false)
    }
  }

  const totalBudgeted = entries.reduce((sum, e) => {
    const value = parseFloat(e.budgeted || '0')
    return sum + (isNaN(value) ? 0 : value)
  }, 0)

  const totalSpent = entries.reduce((sum, e) => {
    const value = parseFloat(e.spent || '0')
    return sum + (isNaN(value) ? 0 : value)
  }, 0)

  const incomeAmount = parseFloat(income.amount || '0') || 0
  const plannedSavings = incomeAmount - totalBudgeted
  const actualSavings = incomeAmount - totalSpent

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
          <p className="text-muted-foreground">
            Track your spending for {format(currentMonth, 'MMMM yyyy')}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <RefreshCw className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
          {saving ? 'Saving...' : 'Save All'}
        </Button>
      </div>

      <Tabs defaultValue="entry" className="space-y-6">
        <TabsList>
          <TabsTrigger value="entry">Monthly Entry</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="entry">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="income">Income Amount</Label>
                    <Input
                      id="income"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={income.amount || ''}
                      onChange={(e) => handleIncomeChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="note">Note (optional)</Label>
                    <Input
                      id="note"
                      type="text"
                      placeholder="e.g., Bonus included"
                      value={income.note || ''}
                      onChange={(e) => handleNoteChange(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Entries</CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <p className="text-muted-foreground">
                    No categories found. <a href="/budget/categories" className="text-blue-600 hover:underline">Add some categories</a> to get started.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Budgeted</TableHead>
                        <TableHead>Spent</TableHead>
                        <TableHead>Remaining</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry) => {
                        const budgeted = parseFloat(entry.budgeted || '0') || 0
                        const spent = parseFloat(entry.spent || '0') || 0
                        const remaining = budgeted - spent
                        
                        return (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">{entry.name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={entry.budgeted}
                                onChange={(e) => handleBudgetedChange(entry.id, e.target.value)}
                                className="w-28"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={entry.spent}
                                onChange={(e) => handleSpentChange(entry.id, e.target.value)}
                                className="w-28"
                              />
                            </TableCell>
                            <TableCell>
                              <span className={remaining >= 0 ? 'text-green-700' : 'text-red-700'}>
                                ${remaining.toLocaleString()}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Income</Label>
                    <div className="text-2xl font-bold">
                      ${incomeAmount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total Budgeted</Label>
                    <div className="text-2xl font-bold">
                      ${totalBudgeted.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total Spent</Label>
                    <div className="text-2xl font-bold">
                      ${totalSpent.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Planned Savings</Label>
                    <div className={`text-2xl font-bold ${plannedSavings >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      ${plannedSavings.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Actual Savings</Label>
                    <div className={`text-2xl font-bold ${actualSavings >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      ${actualSavings.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Spent - {currentMonth.getFullYear()}</CardTitle>
              </CardHeader>
              <CardContent>
                {trendData.some(d => d.budgeted !== 0 || d.spent !== 0) ? (
                  <BudgetChart data={trendData} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data yet. Add budget entries to see trends.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income & Savings - {currentMonth.getFullYear()}</CardTitle>
              </CardHeader>
              <CardContent>
                {trendData.some(d => d.income !== 0) ? (
                  <SavingsChart data={trendData} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No income data yet. Add income to see savings trends.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}