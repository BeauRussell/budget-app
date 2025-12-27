import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseQuery, parseBody, tryCatchDb, toResponse } from '@/lib/result'
import { getNetWorthQuery, saveSnapshotsBody } from '@/lib/schemas'
import { ValidationError, DatabaseError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  return pipe(
    E.right(new URL(request.url)),
    E.chain((url) => parseQuery(getNetWorthQuery)(url.searchParams)),
    TE.fromEither,
    TE.chain(({ month, year }) =>
      tryCatchDb(
        async () => {
          const accounts = await prisma.account.findMany({
            where: { isActive: true },
            include: {
              category: true,
              snapshots: {
                where: { month, year },
                take: 1
              }
            },
            orderBy: [
              { name: 'asc' }
            ]
          })

          const formatted = accounts.map(account => ({
            id: account.id,
            name: account.name,
            type: account.type,
            category: account.category.name,
            categoryId: account.categoryId,
            currentValue: account.snapshots[0]?.value || null,
            hasSnapshot: account.snapshots.length > 0
          }))

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
    TE.chain((body) => TE.fromEither(parseBody(saveSnapshotsBody)(body))),
    TE.chain((validated) =>
      tryCatchDb(
        async () => {
          try {
            return await prisma.$transaction(async (tx) => {
              const results = []

              for (const snapshot of validated.snapshots) {
                const { accountId, value } = snapshot

                if (!accountId || value === undefined || value === null) {
                  throw new Error('Account ID and value are required for all snapshots')
                }

                const existing = await tx.netWorthSnapshot.findUnique({
                  where: {
                    accountId_month_year: {
                      accountId,
                      month: validated.month,
                      year: validated.year
                    }
                  }
                })

                if (existing) {
                  const updated = await tx.netWorthSnapshot.update({
                    where: { id: existing.id },
                    data: { value: parseFloat(value.toString()) }
                  })
                  results.push(updated)
                } else {
                  const created = await tx.netWorthSnapshot.create({
                    data: {
                      accountId,
                      month: validated.month,
                      year: validated.year,
                      value: parseFloat(value.toString())
                    }
                  })
                  results.push(created)
                }
              }

              return results
            })
          } catch (error) {
            if (error instanceof Error && error.message.includes('Account ID and value are required')) {
              throw ValidationError(error.message, [{ path: 'snapshots', message: error.message }])
            }
            throw error
          }
        },
        (error) => {
          if (error instanceof Error && error.message.includes('Account ID and value are required')) {
            return ValidationError('Account ID and value are required for all snapshots', [{ path: 'snapshots', message: error.message }])
          }
          return DatabaseError('Failed to save net worth snapshots', error)
        }
      )
    ),
    TE.map((result) => ({ success: true, count: result.length })),
    (te) => toResponse(te)
  )
}
