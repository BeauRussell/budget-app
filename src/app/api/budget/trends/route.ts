import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Get all budget entries for the year
    const entries = await prisma.budgetEntry.findMany({
      where: { year },
      orderBy: [
        { month: 'asc' }
      ]
    })

    // Get all income for the year
    const incomes = await prisma.monthlyIncome.findMany({
      where: { year }
    })

    // Group by month
    const monthlyData: Record<number, { budgeted: number; spent: number; income: number }> = {}
    
    for (let month = 1; month <= 12; month++) {
      monthlyData[month] = { budgeted: 0, spent: 0, income: 0 }
    }

    for (const entry of entries) {
      monthlyData[entry.month].budgeted += parseFloat(entry.budgeted.toString())
      monthlyData[entry.month].spent += parseFloat(entry.spent.toString())
    }

    for (const income of incomes) {
      monthlyData[income.month].income = parseFloat(income.amount.toString())
    }

    // Format for Recharts
    const chartData = Object.entries(monthlyData).map(([month, data]) => ({
      month: getMonthName(parseInt(month)),
      monthNum: parseInt(month),
      budgeted: data.budgeted,
      spent: data.spent,
      income: data.income,
      savings: data.income - data.spent
    }))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Error fetching budget trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget trends' },
      { status: 500 }
    )
  }
}

function getMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[month - 1]
}