import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseQuery, parseBody, tryCatchDb, toResponse } from '@/lib/result'
import { getIncomeQuery, saveIncomeBody } from '@/lib/schemas'
import { ValidationError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  return pipe(
    E.right(new URL(request.url)),
    E.chain((url) => parseQuery(getIncomeQuery)(url.searchParams)),
    TE.fromEither,
    TE.chain(({ month, year }) =>
      tryCatchDb(
        () => prisma.monthlyIncome.findUnique({
          where: {
            month_year: { month, year }
          }
        })
      )
    ),
    TE.map((income) => income || { amount: null, note: null }),
    (te) => toResponse(te)
  )
}

export async function POST(request: NextRequest) {
  return pipe(
    TE.tryCatch(
      async () => await request.json(),
      () => ValidationError('Failed to parse request body', [])
    ),
    TE.chain((body) => TE.fromEither(parseBody(saveIncomeBody)(body))),
    TE.chain((validated) =>
      tryCatchDb(
        async () => {
          const existing = await prisma.monthlyIncome.findUnique({
            where: {
              month_year: { month: validated.month, year: validated.year }
            }
          })

          if (existing) {
            return await prisma.monthlyIncome.update({
              where: { id: existing.id },
              data: {
                amount: parseFloat(validated.amount.toString()),
                note: validated.note || null
              }
            })
          } else {
            return await prisma.monthlyIncome.create({
              data: {
                month: validated.month,
                year: validated.year,
                amount: parseFloat(validated.amount.toString()),
                note: validated.note || null
              }
            })
          }
        }
      )
    ),
    (te) => toResponse(te)
  )
}
