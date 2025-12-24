"use client"

import { Suspense, useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { format, parseISO } from "date-fns"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Calendar as CalendarIcon,
  RefreshCcw,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { MonthNavigator } from "@/components/layout/month-navigator"
import { useMonthNavigation } from "@/hooks/use-month-navigation"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  type: string
}

interface Transaction {
  id: string
  date: string
  amount: string
  vendor: string | null
  description: string | null
  categoryId: string
  isRecurring: boolean
  category: Category
}

interface Suggestion {
  originalTransaction: Transaction
  suggestedDate: string
}

function TransactionsContent() {
  const searchParams = useSearchParams()
  const { currentMonth, goToMonth } = useMonthNavigation()
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(true)
  
  // Filter state
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  
  const amountInputRef = useRef<HTMLInputElement>(null)

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [formData, setFormData] = useState({
    date: new Date(),
    amount: "",
    vendor: "",
    description: "",
    categoryId: "",
    isRecurring: false,
  })

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const month = currentMonth.getMonth() + 1
      const year = currentMonth.getFullYear()
      const params = new URLSearchParams({
        month: month.toString(),
        year: year.toString(),
      })
      if (categoryFilter !== "all") params.append("categoryId", categoryFilter)
      if (search) params.append("search", search)

      const response = await fetch(`/api/transactions?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast.error("Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }, [currentMonth, categoryFilter, search])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/budget-categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data.filter((c: any) => c.isActive))
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }, [])

  const fetchSuggestions = useCallback(async () => {
    try {
      const month = currentMonth.getMonth() + 1
      const year = currentMonth.getFullYear()
      const response = await fetch(`/api/transactions/recurring-suggestions?month=${month}&year=${year}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data)
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    fetchCategories()
    fetchSuggestions()
  }, [fetchCategories, fetchSuggestions])

  useEffect(() => {
    const catId = searchParams.get("category")
    if (catId) setCategoryFilter(catId)
  }, [searchParams])

  const handleOpenDialog = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction)
      setFormData({
        date: parseISO(transaction.date),
        amount: transaction.amount,
        vendor: transaction.vendor || "",
        description: transaction.description || "",
        categoryId: transaction.categoryId,
        isRecurring: transaction.isRecurring,
      })
    } else {
      setEditingTransaction(null)
      setFormData({
        date: new Date(),
        amount: "",
        vendor: "",
        description: "",
        categoryId: "",
        isRecurring: false,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async (e?: React.FormEvent, stayOpen = false) => {
    if (e) e.preventDefault()
    if (!formData.date || !formData.amount || !formData.categoryId) {
      toast.error("Please fill in all required fields")
      return
    }

    const payload = {
      ...formData,
      date: formData.date.toISOString(),
    }

    try {
      const url = editingTransaction 
        ? `/api/transactions/${editingTransaction.id}`
        : "/api/transactions"
      const method = editingTransaction ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(editingTransaction ? "Transaction updated" : "Transaction created")
        if (stayOpen) {
          setFormData(prev => ({
            ...prev,
            amount: "",
            vendor: "",
            description: "",
          }))
          // Focus amount field for next entry
          setTimeout(() => {
            amountInputRef.current?.focus()
          }, 0)
        } else {
          setIsDialogOpen(false)
        }
        fetchTransactions()
        fetchSuggestions()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to save transaction")
      }
    } catch (error) {
      console.error("Error saving transaction:", error)
      toast.error("An error occurred while saving")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Transaction deleted")
        fetchTransactions()
        fetchSuggestions()
      } else {
        toast.error("Failed to delete transaction")
      }
    } catch (error) {
      console.error("Error deleting transaction:", error)
      toast.error("An error occurred while deleting")
    }
  }

  const handleApplySuggestion = async (suggestion: Suggestion) => {
    const { originalTransaction, suggestedDate } = suggestion
    const payload = {
      date: suggestedDate,
      amount: originalTransaction.amount,
      vendor: originalTransaction.vendor,
      description: originalTransaction.description,
      categoryId: originalTransaction.categoryId,
      isRecurring: true,
    }

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success("Recurring transaction applied")
        fetchTransactions()
        fetchSuggestions()
      }
    } catch (error) {
      console.error("Error applying suggestion:", error)
      toast.error("Failed to apply suggestion")
    }
  }

  const totalAmount = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex items-center gap-4">
          <MonthNavigator currentMonth={currentMonth} onMonthChange={goToMonth} />
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium text-blue-900">
                {suggestions.length} recurring transaction suggestions available
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="py-2 space-y-2">
            {suggestions.map((suggestion, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-2 rounded border border-blue-100 text-sm">
                <div>
                  <span className="font-semibold">{suggestion.originalTransaction.vendor}</span>
                  <span className="text-muted-foreground mx-2">•</span>
                  <span>{format(parseISO(suggestion.suggestedDate), 'MMM d')}</span>
                  <span className="text-muted-foreground mx-2">•</span>
                  <span>${parseFloat(suggestion.originalTransaction.amount).toLocaleString()}</span>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleApplySuggestion(suggestion)}>
                  Apply
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendor or description..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No transactions found for this period.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[100px] text-center">Recurring</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{format(parseISO(tx.date), "MMM d")}</TableCell>
                    <TableCell className="font-medium">{tx.vendor || "-"}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {tx.description || "-"}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        {tx.category.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      {tx.isRecurring && <RefreshCcw className="h-3 w-3 inline text-blue-600" />}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(tx)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(tx.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-dashed">
            <span className="text-sm font-medium text-muted-foreground">Total Spent this month</span>
            <span className="text-xl font-bold">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => date && setFormData({ ...formData, date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  ref={amountInputRef}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What was it for?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: !!checked })}
                />
                <Label htmlFor="isRecurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Mark as recurring transaction
                </Label>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                {!editingTransaction && (
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => handleSave(undefined, true)}
                  >
                    Save & Add Another
                  </Button>
                )}
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  export default function TransactionsPage() {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <TransactionsContent />
      </Suspense>
    )
  }

