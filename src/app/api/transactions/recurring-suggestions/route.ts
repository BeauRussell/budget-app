import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subMonths, startOfMonth, endOfMonth, setDate } from 'date-fns'

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

    const currentMonthStart = startOfMonth(new Date(year, month - 1))
    
    // Look back at the last 3 months for recurring transactions
    const lookbackStart = startOfMonth(subMonths(currentMonthStart, 3))
    const lookbackEnd = endOfMonth(subMonths(currentMonthStart, 1))

    const recurringTransactions = await (prisma as any).transaction.findMany({
      where: {
        isRecurring: true,
        date: {
          gte: lookbackStart,
          lte: lookbackEnd
        }
      },
      orderBy: { date: 'desc' }
    })

    // Get current month's transactions to avoid duplicates
    const currentTransactions = await (prisma as any).transaction.findMany({
      where: {
        date: {
          gte: currentMonthStart,
          lte: endOfMonth(currentMonthStart)
        }
      }
    })

    const suggestions: any[] = []
    const seenGroup = new Set() // Unique by category + vendor + day

    for (const tx of recurringTransactions) {
      const txDay = new Date(tx.date).getDate()
      const groupKey = `${tx.categoryId}-${tx.vendor}-${txDay}`

      if (seenGroup.has(groupKey)) continue
      
      // Check if already exists in current month
      const alreadyExists = currentTransactions.some((curr: any) => 
        curr.categoryId === tx.categoryId && 
        curr.vendor === tx.vendor && 
        new Date(curr.date).getDate() === txDay
      )

      if (!alreadyExists) {
        suggestions.push({
          originalTransaction: tx,
          suggestedDate: setDate(currentMonthStart, txDay).toISOString()
        })
        seenGroup.add(groupKey)
      }
    }

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Error fetching recurring suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring suggestions' },
      { status: 500 }
    )
  }
}
