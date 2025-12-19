"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface BudgetChartProps {
  data: Array<{
    month: string
    monthNum: number
    budgeted: number
    spent: number
    income: number
    savings: number
  }>
}

export function BudgetChart({ data }: BudgetChartProps) {
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '$0'
    return `$${value.toLocaleString()}`
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => formatCurrency(value)} />
        <Tooltip formatter={(value) => formatCurrency(value as number)} />
        <Legend />
        <Bar dataKey="budgeted" fill="#94a3b8" name="Budgeted" />
        <Bar dataKey="spent" fill="#f97316" name="Spent" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SavingsChart({ data }: BudgetChartProps) {
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '$0'
    return `$${value.toLocaleString()}`
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => formatCurrency(value)} />
        <Tooltip formatter={(value) => formatCurrency(value as number)} />
        <Legend />
        <Bar dataKey="income" fill="#22c55e" name="Income" />
        <Bar dataKey="spent" fill="#ef4444" name="Spent" />
        <Bar dataKey="savings" fill="#3b82f6" name="Savings" />
      </BarChart>
    </ResponsiveContainer>
  )
}