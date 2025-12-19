"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"

interface Account {
  id: string
  name: string
  type: string
  categoryId: string
  category: {
    id: string
    name: string
  }
  isActive: boolean
  createdAt: string
  snapshots: Array<{
    id: string
    value: string
    month: number
    year: number
  }>
}

interface AccountCategory {
  id: string
  name: string
  type: string
  isDefault: boolean
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<AccountCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "ASSET" as "ASSET" | "DEBT",
    categoryId: "",
  })

  useEffect(() => {
    fetchAccounts()
    fetchCategories()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/account-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.categoryId) return

    const url = editingAccount 
      ? `/api/accounts/${editingAccount.id}`
      : '/api/accounts'
    
    const method = editingAccount ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          categoryId: formData.categoryId,
        })
      })

      if (response.ok) {
        await fetchAccounts()
        setDialogOpen(false)
        setFormData({ name: "", type: "ASSET", categoryId: "" })
        setEditingAccount(null)
      } else {
        const error = await response.json()
        console.error('Error saving account:', error.error)
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Error saving account:', error)
      // TODO: Show error toast
    }
  }

  const handleEdit = (account: Account) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      type: account.type as "ASSET" | "DEBT",
      categoryId: account.categoryId,
    })
    setDialogOpen(true)
  }

  const handleToggleActive = async (account: Account) => {
    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !account.isActive })
      })

      if (response.ok) {
        await fetchAccounts()
      } else {
        const error = await response.json()
        console.error('Error toggling account:', error.error)
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Error toggling account:', error)
      // TODO: Show error toast
    }
  }

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchAccounts()
      } else {
        const error = await response.json()
        console.error('Error deleting account:', error.error)
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      // TODO: Show error toast
    }
  }

  const openDialog = () => {
    setEditingAccount(null)
    setFormData({ name: "", type: "ASSET", categoryId: "" })
    setDialogOpen(true)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  const latestValue = (account: Account) => {
    if (account.snapshots.length === 0) return null
    const latest = account.snapshots[0]
    return parseFloat(latest.value)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your assets and debts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Edit Account' : 'Add Account'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter account name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Account Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: "ASSET" | "DEBT") => 
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSET">Asset</SelectItem>
                    <SelectItem value="DEBT">Debt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => {
                    const category = categories.find(c => c.id === value)
                    setFormData({ 
                      ...formData, 
                      categoryId: value,
                      type: (category?.type as "ASSET" | "DEBT") || formData.type
                    })
                  }}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingAccount ? 'Update' : 'Create'} Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Latest Value</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>
                    <Badge variant={account.type === 'ASSET' ? 'default' : 'destructive'}>
                      {account.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{account.category.name}</TableCell>
                  <TableCell>
                    {latestValue(account) 
                      ? `$${latestValue(account)?.toLocaleString()}` 
                      : 'Not set'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={account.isActive}
                        onCheckedChange={() => handleToggleActive(account)}
                      />
                      {account.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(account)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}