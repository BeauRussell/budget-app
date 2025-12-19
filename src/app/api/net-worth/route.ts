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

    // Get active accounts with their snapshots for the month
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: {
        category: true,
        snapshots: {
          where: { month, year },
          take: 1
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    })

    // Format the data for the frontend
    const formatted = accounts.map(account => ({
      id: account.id,
      name: account.name,
      type: account.type,
      category: account.category.name,
      categoryId: account.categoryId,
      currentValue: account.snapshots[0]?.value || null,
      hasSnapshot: account.snapshots.length > 0
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching net worth data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch net worth data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, year, snapshots } = body

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(snapshots) || snapshots.length === 0) {
      return NextResponse.json(
        { error: 'Snapshots must be a non-empty array' },
        { status: 400 }
      )
    }

    // Use a transaction to ensure all updates succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      const results = []

      for (const snapshot of snapshots) {
        const { accountId, value } = snapshot

        if (!accountId || value === undefined || value === null) {
          throw new Error('Account ID and value are required for all snapshots')
        }

        const existing = await tx.netWorthSnapshot.findUnique({
          where: {
            accountId_month_year: {
              accountId,
              month,
              year
            }
          }
        })

        if (existing) {
          // Update existing snapshot
          const updated = await tx.netWorthSnapshot.update({
            where: { id: existing.id },
            data: { value: parseFloat(value) }
          })
          results.push(updated)
        } else {
          // Create new snapshot
          const created = await tx.netWorthSnapshot.create({
            data: {
              accountId,
              month,
              year,
              value: parseFloat(value)
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
    console.error('Error saving net worth snapshots:', error)
    return NextResponse.json(
      { error: 'Failed to save net worth snapshots' },
      { status: 500 }
    )
  }
}