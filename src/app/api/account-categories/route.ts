import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseJsonBody, parseBody, tryCatchDb, toResponse } from '@/lib/result'
import { createAccountCategoryBody } from '@/lib/schemas'
import { ConflictError } from '@/lib/errors'

export async function GET() {
  return pipe(
    tryCatchDb(
      () => prisma.accountCategory.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { accounts: true }
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
    TE.chain((body) => TE.fromEither(parseBody(createAccountCategoryBody)(body))),
    TE.chain((validated) =>
      tryCatchDb(
        () => prisma.accountCategory.create({
          data: {
            name: validated.name.trim(),
            type: validated.type || 'ASSET',
            isDefault: false,
          },
        }),
        (error) => {
          if (error instanceof Error && error.message.includes('Unique constraint')) {
            return ConflictError('Category name already exists', 'AccountCategory')
          }
          return { _tag: 'DatabaseError', message: 'Failed to create account category', cause: error }
        }
      )
    ),
    (te) => toResponse(te, 201)
  )
}
