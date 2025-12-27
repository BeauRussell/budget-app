import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseJsonBody, parseBody, tryCatchDb, toResponse } from '@/lib/result'
import { createBudgetCategoryBody } from '@/lib/schemas'
import { ConflictError, DatabaseError } from '@/lib/errors'

export async function GET() {
  return pipe(
    tryCatchDb(
      () => prisma.budgetCategory.findMany({
        where: { isActive: true },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ],
        include: {
          _count: {
            select: { entries: true }
          }
        }
      })
    ),
    (te) => toResponse(te)
  )
}

export async function POST(request: NextRequest) {
  return pipe(
    parseJsonBody(request),
    TE.chain((body) => TE.fromEither(parseBody(createBudgetCategoryBody)(body))),
    TE.chain((validated) =>
      pipe(
        E.tryCatch(
          async () => {
            const maxSortOrder = await prisma.budgetCategory.findFirst({
              orderBy: { sortOrder: 'desc' },
              select: { sortOrder: true }
            })
            return (maxSortOrder?.sortOrder || 0) + 1
          },
          () => DatabaseError('Failed to get max sort order', undefined)
        ),
        TE.fromEither,
        TE.chain((sortOrder) =>
          tryCatchDb(
            async () => {
              const sortOrderValue = await sortOrder
              return prisma.budgetCategory.create({
                data: {
                  name: validated.name.trim(),
                  type: validated.type,
                  sortOrder: sortOrderValue
                },
                include: {
                  _count: {
                    select: { entries: true }
                  }
                }
              })
            },
            (error) => {
              if (error instanceof Error && error.message.includes('Unique constraint')) {
                return ConflictError('Category name already exists', 'BudgetCategory')
              }
              return DatabaseError('Failed to create budget category', error)
            }
          )
        )
      )
    ),
    (te) => toResponse(te, 201)
  )
}
