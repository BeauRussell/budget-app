import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subMonths, startOfMonth, endOfMonth } from 'date-fns'

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

    const recurringTransactions = await prisma.transaction.findMany({
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
    const currentTransactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: currentMonthStart,
          lte: endOfMonth(currentMonthStart)
        }
      }
    })

    const suggestions = []
    const seenGroup = new Set() // Unique by category + vendor + day

    for (const tx of recurringTransactions) {
      const txDate = new Date(tx.date)
      const txDay = txDate.getUTCDate()
      const groupKey = `${tx.categoryId}-${tx.vendor}-${txDay}`

      if (seenGroup.has(groupKey)) continue
      
      // Check if already exists in current month
      const alreadyExists = currentTransactions.some((curr: { categoryId: string; vendor: string | null; date: Date | string }) => 
        curr.categoryId === tx.categoryId && 
        curr.vendor === tx.vendor && 
        new Date(curr.date).getUTCDate() === txDay
      )

      if (!alreadyExists) {
        // Use noon UTC to avoid timezone shifts during display in the browser
        const suggestedDate = new Date(Date.UTC(year, month - 1, txDay, 12, 0, 0))
        suggestions.push({
          originalTransaction: tx,
          suggestedDate: suggestedDate.toISOString()
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
