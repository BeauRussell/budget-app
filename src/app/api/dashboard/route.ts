import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '')
    const year = parseInt(searchParams.get('year') || '')

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      )
    }

    // Get net worth data
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: {
        snapshots: {
          where: { month, year },
          take: 1
        }
      }
    })

    const totalAssets = accounts
      .filter(a => a.type === 'ASSET')
      .reduce((sum, a) => {
        const value = a.snapshots[0]?.value
        return sum + (value ? parseFloat(value.toString()) : 0)
      }, 0)

    const totalDebts = accounts
      .filter(a => a.type === 'DEBT')
      .reduce((sum, a) => {
        const value = a.snapshots[0]?.value
        return sum + (value ? parseFloat(value.toString()) : 0)
      }, 0)

    const netWorth = totalAssets - totalDebts

    // Get budget data
    const budgetEntries = await prisma.budgetEntry.findMany({
      where: { month, year }
    })

    const totalBudgeted = budgetEntries.reduce((sum, e) => 
      sum + parseFloat(e.budgeted.toString()), 0)
    const totalSpent = budgetEntries.reduce((sum, e) => 
      sum + parseFloat(e.spent.toString()), 0)

    // Get income
    const income = await prisma.monthlyIncome.findUnique({
      where: { month_year: { month, year } }
    })

    const incomeAmount = income ? parseFloat(income.amount.toString()) : 0
    const plannedSavings = incomeAmount - totalBudgeted
    const actualSavings = incomeAmount - totalSpent
    const savingsRate = incomeAmount > 0 ? (actualSavings / incomeAmount) * 100 : 0

    return NextResponse.json({
      netWorth: {
        totalAssets,
        totalDebts,
        netWorth
      },
      budget: {
        income: incomeAmount,
        totalBudgeted,
        totalSpent,
        plannedSavings,
        actualSavings,
        savingsRate
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}