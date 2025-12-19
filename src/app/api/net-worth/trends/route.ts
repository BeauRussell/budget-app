import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Get all snapshots for the year
    const snapshots = await prisma.netWorthSnapshot.findMany({
      where: { year },
      include: {
        account: true
      },
      orderBy: [
        { month: 'asc' }
      ]
    })

    // Group by month
    const monthlyData: Record<number, { assets: number; debts: number }> = {}
    
    for (let month = 1; month <= 12; month++) {
      monthlyData[month] = { assets: 0, debts: 0 }
    }

    for (const snapshot of snapshots) {
      const value = parseFloat(snapshot.value.toString())
      if (snapshot.account.type === 'ASSET') {
        monthlyData[snapshot.month].assets += value
      } else {
        monthlyData[snapshot.month].debts += value
      }
    }

    // Format for Recharts
    const chartData = Object.entries(monthlyData).map(([month, data]) => ({
      month: getMonthName(parseInt(month)),
      monthNum: parseInt(month),
      assets: data.assets,
      debts: data.debts,
      netWorth: data.assets - data.debts
    }))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Error fetching net worth trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch net worth trends' },
      { status: 500 }
    )
  }
}

function getMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[month - 1]
}