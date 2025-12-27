import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseQuery, tryCatchDb, toResponse } from '@/lib/result'
import { monthYearQuery } from '@/lib/schemas'
import { subMonths, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  return pipe(
    E.right(new URL(request.url)),
    E.chain((url) => parseQuery(monthYearQuery)(url.searchParams)),
    TE.fromEither,
    TE.chain(({ month, year }) =>
      tryCatchDb(
        async () => {
          const currentMonthStart = startOfMonth(new Date(year, month - 1))

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

          const currentTransactions = await prisma.transaction.findMany({
            where: {
              date: {
                gte: currentMonthStart,
                lte: endOfMonth(currentMonthStart)
              }
            }
          }
          )

          const suggestions = []
          const seenGroup = new Set()

          for (const tx of recurringTransactions) {
            const txDate = new Date(tx.date)
            const txDay = txDate.getUTCDate()
            const groupKey = `${tx.categoryId}-${tx.vendor}-${txDay}`

            if (seenGroup.has(groupKey)) continue

            const alreadyExists = currentTransactions.some((curr: { categoryId: string; vendor: string | null; date: Date | string }) =>
              curr.categoryId === tx.categoryId &&
              curr.vendor === tx.vendor &&
              new Date(curr.date).getUTCDate() === txDay
            )

            if (!alreadyExists) {
              const suggestedDate = new Date(Date.UTC(year, month - 1, txDay, 12, 0, 0))
              suggestions.push({
                originalTransaction: tx,
                suggestedDate: suggestedDate.toISOString()
              })
              seenGroup.add(groupKey)
            }
          }

          return suggestions
        }
      )
    ),
    (te) => toResponse(te)
  )
}
