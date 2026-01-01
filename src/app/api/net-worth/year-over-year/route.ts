import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseQuery, tryCatchDb, toResponse } from '@/lib/result'
import { optionalMonthYearQuery } from '@/lib/schemas'

export async function GET(request: NextRequest) {
  return pipe(
    E.right(new URL(request.url)),
    E.chain((url) => parseQuery(optionalMonthYearQuery)(url.searchParams)),
    TE.fromEither,
    TE.chain((query) =>
      tryCatchDb(
        async () => {
          const currentDate = new Date()
          const monthValue = query.month || currentDate.getMonth() + 1
          const yearValue = query.year || currentDate.getFullYear()

          const snapshots = await prisma.netWorthSnapshot.findMany({
            where: {
              month: monthValue,
              year: { lte: yearValue }
            },
            include: {
              account: true
            },
            orderBy: [
              { year: 'asc' }
            ]
          })

          const yearlyData: Record<number, { assets: number; debts: number }> = {}

          for (const snapshot of snapshots) {
            if (!yearlyData[snapshot.year]) {
              yearlyData[snapshot.year] = { assets: 0, debts: 0 }
            }
            const value = parseFloat(snapshot.value.toString())
            if (snapshot.account.type === 'ASSET') {
              yearlyData[snapshot.year].assets += value
            } else {
              yearlyData[snapshot.year].debts += value
            }
          }

          const chartData = Object.entries(yearlyData)
            .map(([year, data]) => ({
              year: parseInt(year),
              netWorth: data.assets - data.debts
            }))
            .sort((a, b) => a.year - b.year)

          return chartData
        }
      )
    ),
    (te) => toResponse(te)
  )
}
