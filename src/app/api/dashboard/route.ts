import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

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

    // Get budget entries and compute spent amounts from transactions
    const budgetEntries = await prisma.budgetEntry.findMany({
      where: { month, year },
      include: {
        category: true
      }
    })

    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))

    const transactionTotals = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      }
    })

    const totalBudgeted = budgetEntries.reduce((sum, e) => 
      sum + parseFloat(e.budgeted.toString()), 0)
    
    // Instead of using e.spent, which is no longer updated, 
    // we use the transaction totals.
    const totalSpent = transactionTotals.reduce((sum, t) => 
      sum + (t._sum.amount ? parseFloat(t._sum.amount.toString()) : 0), 0)

    const needsSpent = budgetEntries
      .filter(e => e.category.type === 'NEED')
      .reduce((sum, e) => {
        const spent = transactionTotals.find(t => t.categoryId === e.categoryId)?._sum.amount || 0
        return sum + parseFloat(spent.toString())
      }, 0)
    
    const wantsSpent = budgetEntries
      .filter(e => e.category.type === 'WANT')
      .reduce((sum, e) => {
        const spent = transactionTotals.find(t => t.categoryId === e.categoryId)?._sum.amount || 0
        return sum + parseFloat(spent.toString())
      }, 0)
    
    const savingsSpent = budgetEntries
      .filter(e => e.category.type === 'SAVING')
      .reduce((sum, e) => {
        const spent = transactionTotals.find(t => t.categoryId === e.categoryId)?._sum.amount || 0
        return sum + parseFloat(spent.toString())
      }, 0)

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
        savingsRate,
        breakdown: {
          needs: needsSpent,
          wants: wantsSpent,
          savings: savingsSpent
        }
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