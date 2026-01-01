"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface YearOverYearChartProps {
  data: Array<{
    year: number
    netWorth: number
  }>
  month: number
  onYearClick?: (year: number) => void
}

export function YearOverYearChart({ data, month, onYearClick }: YearOverYearChartProps) {
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '$0'
    return `$${value.toLocaleString()}`
  }

  const getMonthName = (month: number): string => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return months[month - 1]
  }

  const getBarColor = (index: number) => {
    if (index === 0) return '#3b82f6'
    const currentNetWorth = data[index]?.netWorth || 0
    const previousNetWorth = data[index - 1]?.netWorth || 0
    return currentNetWorth >= previousNetWorth ? '#22c55e' : '#ef4444'
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onClick={(state: any) => {
          if (state && state.activePayload && state.activePayload.length > 0 && onYearClick) {
            const year = state.activePayload[0].payload.year
            onYearClick(year)
          }
        }}
        className={onYearClick ? "cursor-pointer" : ""}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis tickFormatter={(value) => formatCurrency(value)} />
        <Tooltip
          formatter={(value) => formatCurrency(value as number)}
          labelFormatter={(year) => `${year} - ${getMonthName(month)}`}
        />
        <Bar dataKey="netWorth" name="Net Worth">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
