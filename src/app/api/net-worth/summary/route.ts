import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const snapshots = await prisma.netWorthSnapshot.findMany({
      select: {
        month: true,
        year: true,
      },
      distinct: ['month', 'year'],
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    })

    const years = Array.from(new Set(snapshots.map(s => s.year))).sort((a, b) => b - a)

    return NextResponse.json({
      monthsWithData: snapshots,
      years,
    })
  } catch (error) {
    console.error('Error fetching net worth summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch net worth summary' },
      { status: 500 }
    )
  }
}
