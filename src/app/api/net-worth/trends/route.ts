import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseQuery, tryCatchDb, toResponse } from '@/lib/result'
import { optionalYearQuery } from '@/lib/schemas'

export async function GET(request: NextRequest) {
  return pipe(
    E.right(new URL(request.url)),
    E.chain((url) => parseQuery(optionalYearQuery)(url.searchParams)),
    TE.fromEither,
    TE.chain(({ year }) =>
      tryCatchDb(
        async () => {
          const yearValue = year || new Date().getFullYear()

          const snapshots = await prisma.netWorthSnapshot.findMany({
            where: { year: yearValue },
            include: {
              account: true
            },
            orderBy: [
              { month: 'asc' }
            ]
          })

          const monthlyData: Record<number, { assets: number; debts: number }> = {}

          for (let month =1; month <= 12; month++) {
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

          const chartData = Object.entries(monthlyData).map(([month, data]) => ({
            month: getMonthName(parseInt(month)),
            monthNum: parseInt(month),
            assets: data.assets,
            debts: data.debts,
            netWorth: data.assets - data.debts
          }))

          return chartData
        }
      )
    ),
    (te) => toResponse(te)
  )
}

function getMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[month - 1]
}
