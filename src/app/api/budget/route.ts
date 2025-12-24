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

    // Get active budget categories with their entries for the month
    const categories = await prisma.budgetCategory.findMany({
      where: { isActive: true },
      include: {
        entries: {
          where: { month, year },
          take: 1
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    // Compute spent amounts from transactions
    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))

    const transactionTotals = await (prisma as any).transaction.groupBy({
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

    // Get previous month's entries to use as defaults for budgeted amounts
    const prevDate = startOfMonth(new Date(year, month - 2))
    const prevMonth = prevDate.getMonth() + 1
    const prevYear = prevDate.getFullYear()

    const prevEntries = await prisma.budgetEntry.findMany({
      where: { month: prevMonth, year: prevYear }
    })

    // Format the data for the frontend
    const formatted = categories.map(category => {
      const currentEntry = category.entries[0]
      const prevEntry = prevEntries.find(e => e.categoryId === category.id)
      const spentTotal = transactionTotals.find((t: any) => t.categoryId === category.id)?._sum?.amount || 0
      
      return {
        id: category.id,
        name: category.name,
        type: category.type,
        budgeted: currentEntry?.budgeted?.toString() || prevEntry?.budgeted?.toString() || '',
        spent: spentTotal.toString(),
        hasEntry: !!currentEntry
      }
    })

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching budget data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, year, entries } = body

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: 'Entries must be a non-empty array' },
        { status: 400 }
      )
    }

    // Use a transaction to ensure all updates succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      const results = []

      for (const entry of entries) {
        const { categoryId, budgeted } = entry

        if (!categoryId) {
          throw new Error('Category ID is required for all entries')
        }

        const existing = await tx.budgetEntry.findUnique({
          where: {
            categoryId_month_year: {
              categoryId,
              month,
              year
            }
          }
        })

        const data = {
          budgeted: parseFloat(budgeted) || 0,
          // spent is no longer stored here as it is computed from transactions
        }

        if (existing) {
          // Update existing entry
          const updated = await tx.budgetEntry.update({
            where: { id: existing.id },
            data
          })
          results.push(updated)
        } else {
          // Create new entry
          const created = await tx.budgetEntry.create({
            data: {
              categoryId,
              month,
              year,
              ...data
            }
          })
          results.push(created)
        }
      }

      return results
    })

    return NextResponse.json({ 
      success: true, 
      count: result.length 
    })
  } catch (error) {
    console.error('Error saving budget entries:', error)
    return NextResponse.json(
      { error: 'Failed to save budget entries' },
      { status: 500 }
    )
  }
}
