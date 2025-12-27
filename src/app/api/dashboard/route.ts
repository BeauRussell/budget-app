import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseQuery, tryCatchDb, toResponse } from '@/lib/result'
import { monthYearQuery } from '@/lib/schemas'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  return pipe(
    E.right(new URL(request.url)),
    E.chain((url) => parseQuery(monthYearQuery)(url.searchParams)),
    TE.fromEither,
    TE.chain(({ month, year }) =>
      tryCatchDb(
        async () => {
          const accounts = await prisma.account.findMany({
            where: { isActive: true },
            include: {
              snapshots: {
                where: { month, year },
                take: 1
              }
            }
          })

          const totalAssets = accounts
            .filter(a => a.type === 'ASSET')
            .reduce((sum, a) => {
              const value = a.snapshots[0]?.value
              return sum + (value ? parseFloat(value.toString()) : 0)
            }, 0)

          const totalDebts = accounts
            .filter(a => a.type === 'DEBT')
            .reduce((sum, a) => {
              const value = a.snapshots[0]?.value
              return sum + (value ? parseFloat(value.toString()) : 0)
            }, 0)

          const netWorth = totalAssets - totalDebts

          const budgetEntries = await prisma.budgetEntry.findMany({
            where: { month, year },
            include: {
              category: true
            }
          })

          const startDate = startOfMonth(new Date(year, month - 1))
          const endDate = endOfMonth(new Date(year, month - 1))

          const transactionTotals = await prisma.transaction.groupBy({
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

          const totalBudgeted = budgetEntries.reduce((sum, e) =>
            sum + parseFloat(e.budgeted.toString()), 0)

          const totalSpent = transactionTotals.reduce((sum, t) =>
            sum + (t._sum.amount ? parseFloat(t._sum.amount.toString()) : 0), 0)

          const needsSpent = budgetEntries
            .filter(e => e.category.type === 'NEED')
            .reduce((sum, e) => {
              const spent = transactionTotals.find(t => t.categoryId === e.categoryId)?._sum.amount || 0
              return sum + parseFloat(spent.toString())
            }, 0)

          const wantsSpent = budgetEntries
            .filter(e => e.category.type === 'WANT')
            .reduce((sum, e) => {
              const spent = transactionTotals.find(t => t.categoryId === e.categoryId)?._sum.amount || 0
              return sum + parseFloat(spent.toString())
            }, 0)

          const savingsSpent = budgetEntries
            .filter(e => e.category.type === 'SAVING')
            .reduce((sum, e) => {
              const spent = transactionTotals.find(t => t.categoryId === e.categoryId)?._sum.amount || 0
              return sum + parseFloat(spent.toString())
            }, 0)

          const income = await prisma.monthlyIncome.findUnique({
            where: { month_year: { month, year } }
          })

          const incomeAmount = income ? parseFloat(income.amount.toString()) : 0
          const plannedSavings = incomeAmount - totalBudgeted
          const actualSavings = incomeAmount - totalSpent
          const savingsRate = incomeAmount > 0 ? (actualSavings / incomeAmount) * 100 : 0

          return {
            netWorth: {
              totalAssets,
              totalDebts,
              netWorth
            },
            budget: {
              income: incomeAmount,
              totalBudgeted,
              totalSpent,
              plannedSavings,
              actualSavings,
              savingsRate,
              breakdown: {
                needs: needsSpent,
                wants: wantsSpent,
                savings: savingsSpent
              }
            }
          }
        }
      )
    ),
    (te) => toResponse(te)
  )
}