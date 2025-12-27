import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseQuery, parseBody, tryCatchDb, toResponse } from '@/lib/result'
import { getTransactionsQuery, createTransactionBody } from '@/lib/schemas'
import { startOfMonth, endOfMonth } from 'date-fns'
import { ValidationError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  return pipe(
    E.right(new URL(request.url)),
    E.chain((url) => parseQuery(getTransactionsQuery)(url.searchParams)),
    TE.fromEither,
    TE.chain(({ month, year, categoryId, search }) =>
      tryCatchDb(
        async () => {
          const startDate = startOfMonth(new Date(year, month - 1))
          const endDate = endOfMonth(new Date(year, month - 1))

          const where: {
            date: { gte: Date; lte: Date };
            categoryId?: string;
            OR?: Array<{ vendor?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }>;
          } = {
            date: {
              gte: startDate,
              lte: endDate,
            },
          }

          if (categoryId && categoryId !== 'all') {
            where.categoryId = categoryId
          }

          if (search) {
            where.OR = [
              { vendor: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ]
          }

          const transactions = await prisma.transaction.findMany({
            where,
            include: {
              category: true,
            },
            orderBy: {
              date: 'desc',
            },
          })

          return transactions
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
    TE.chain((body) => TE.fromEither(parseBody(createTransactionBody)(body))),
    TE.chain((validated) =>
      tryCatchDb(
        () => prisma.transaction.create({
          data: {
            date: new Date(validated.date),
            amount: parseFloat(validated.amount.toString()),
            vendor: validated.vendor,
            description: validated.description,
            categoryId: validated.categoryId,
            isRecurring: validated.isRecurring || false,
          },
          include: {
            category: true,
          },
        })
      )
    ),
    (te) => toResponse(te, 201)
  )
}
