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

          const entries = await prisma.budgetEntry.findMany({
            where: { year: yearValue },
            orderBy: [
              { month: 'asc' }
            ]
          })

          const incomes = await prisma.monthlyIncome.findMany({
            where: { year: yearValue }
          })

          const monthlyData: Record<number, { budgeted: number; spent: number; income: number }> = {}

          for (let month = 1; month <= 12; month++) {
            monthlyData[month] = { budgeted: 0, spent: 0, income: 0 }
          }

          for (const entry of entries) {
            monthlyData[entry.month].budgeted += parseFloat(entry.budgeted.toString())
            monthlyData[entry.month].spent += parseFloat(entry.spent.toString())
          }

          for (const income of incomes) {
            monthlyData[income.month].income = parseFloat(income.amount.toString())
          }

          const chartData = Object.entries(monthlyData).map(([month, data]) => ({
            month: getMonthName(parseInt(month)),
            monthNum: parseInt(month),
            budgeted: data.budgeted,
            spent: data.spent,
            income: data.income,
            savings: data.income - data.spent
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