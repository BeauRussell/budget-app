import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseQuery, tryCatchDb, toResponse } from '@/lib/result'
import { monthYearQuery } from '@/lib/schemas'

export async function GET(request: NextRequest) {
  return pipe(
    E.right(new URL(request.url)),
    E.chain((url) => parseQuery(monthYearQuery)(url.searchParams)),
    TE.fromEither,
    TE.chain(({ month, year }) =>
      tryCatchDb(
        async () => {
          const endDate = new Date(year, month - 1, 1)
          const startDate = new Date(year, month - 13, 1)

          const snapshots = await prisma.netWorthSnapshot.findMany({
            where: {
              OR: [
                { year: startDate.getFullYear(), month: { gte: startDate.getMonth() + 1 } },
                { year: { gt: startDate.getFullYear(), lt: endDate.getFullYear() } },
                { year: endDate.getFullYear(), month: { lte: endDate.getMonth() + 1 } }
              ]
            },
            include: {
              account: true
            },
            orderBy: [
              { year: 'asc' },
              { month: 'asc' }
            ]
          })

          const monthlyData: Map<string, { assets: number; debts: number; monthNum: number; date: Date }> = new Map()

          for (let i = 0; i < 12; i++) {
            const date = new Date(year, month - 13 + i, 1)
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`
            monthlyData.set(key, { assets: 0, debts: 0, monthNum: date.getMonth() + 1, date })
          }

          for (const snapshot of snapshots) {
            const key = `${snapshot.year}-${snapshot.month}`
            const data = monthlyData.get(key)
            if (!data) continue

            const value = parseFloat(snapshot.value.toString())
            if (snapshot.account.type === 'ASSET') {
              data.assets += value
            } else {
              data.debts += value
            }
          }

          const chartData = Array.from(monthlyData.values()).map(data => ({
            month: `${getMonthName(data.monthNum)} ${data.date.getFullYear()}`,
            year: data.date.getFullYear(),
            monthNum: data.monthNum,
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
