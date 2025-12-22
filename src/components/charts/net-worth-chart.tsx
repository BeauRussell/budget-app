"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface NetWorthChartProps {
  data: Array<{
    month: string
    monthNum: number
    assets: number
    debts: number
    netWorth: number
  }>
  onMonthClick?: (monthNum: number) => void
  showAssets?: boolean
  showDebts?: boolean
  showNetWorth?: boolean
}

export function NetWorthChart({ 
  data, 
  onMonthClick,
  showAssets = true,
  showDebts = true,
  showNetWorth = true
}: NetWorthChartProps) {
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '$0'
    return `$${value.toLocaleString()}`
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart 
        data={data} 
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onClick={(state: any) => {
          if (state && state.activePayload && state.activePayload.length > 0 && onMonthClick) {
            const monthNum = state.activePayload[0].payload.monthNum
            onMonthClick(monthNum)
          }
        }}
        className={onMonthClick ? "cursor-pointer" : ""}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => formatCurrency(value)} />
        <Tooltip formatter={(value) => formatCurrency(value as number)} />
        <Legend />
        {showAssets && (
          <Line 
            type="monotone" 
            dataKey="assets" 
            stroke="#22c55e" 
            strokeWidth={2}
            name="Assets"
          />
        )}
        {showDebts && (
          <Line 
            type="monotone" 
            dataKey="debts" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="Debts"
          />
        )}
        {showNetWorth && (
          <Line 
            type="monotone" 
            dataKey="netWorth" 
            stroke="#3b82f6" 
            strokeWidth={3}
            name="Net Worth"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}