import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseQuery, parseBody, tryCatchDb, toResponse } from '@/lib/result'
import { monthYearQuery, saveBudgetEntriesBody } from '@/lib/schemas'
import { startOfMonth, endOfMonth } from 'date-fns'
import { ValidationError, DatabaseError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  return pipe(
    E.right(new URL(request.url)),
    E.chain((url) => parseQuery(monthYearQuery)(url.searchParams)),
    TE.fromEither,
    TE.chain(({ month, year }) =>
      tryCatchDb(
        async () => {
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

          const prevDate = startOfMonth(new Date(year, month - 2))
          const prevMonth = prevDate.getMonth() + 1
          const prevYear = prevDate.getFullYear()

          const prevEntries = await prisma.budgetEntry.findMany({
            where: { month: prevMonth, year: prevYear }
          })

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

          return formatted
        }
      )
    ),
    (te) => toResponse(te)
  )
}

export async function POST(request: NextRequest) {
  return pipe(
    TE.tryCatch(
      async () => await request.json(),
      () => ValidationError('Failed to parse request body', [])
    ),
    TE.chain((body) => TE.fromEither(parseBody(saveBudgetEntriesBody)(body))),
    TE.chain((validated) =>
      tryCatchDb(
        async () => {
          try {
            return await prisma.$transaction(async (tx) => {
              const results = []

              for (const entry of validated.entries) {
                const { categoryId, budgeted } = entry

                if (!categoryId) {
                  throw new Error('Category ID is required for all entries')
                }

                const existing = await tx.budgetEntry.findUnique({
                  where: {
                    categoryId_month_year: {
                      categoryId,
                      month: validated.month,
                      year: validated.year
                    }
                  }
                })

                const data = {
                  budgeted: parseFloat(budgeted.toString()) || 0,
                }

                if (existing) {
                  const updated = await tx.budgetEntry.update({
                    where: { id: existing.id },
                    data
                  })
                  results.push(updated)
                } else {
                  const created = await tx.budgetEntry.create({
                    data: {
                      categoryId,
                      month: validated.month,
                      year: validated.year,
                      ...data
                    }
                  })
                  results.push(created)
                }
              }

              return results
            })
          } catch (error) {
            if (error instanceof Error && error.message.includes('Category ID is required')) {
              throw ValidationError('Category ID is required for all entries', [{ path: 'entries', message: error.message }])
            }
            throw error
          }
        },
        (error) => {
          if (error instanceof Error && error.message.includes('Category ID is required')) {
            return ValidationError('Category ID is required for all entries', [{ path: 'entries', message: error.message }])
          }
          return DatabaseError('Failed to save budget entries', error)
        }
      )
    ),
    TE.map((result) => ({ success: true, count: result.length })),
    (te) => toResponse(te)
  )
}