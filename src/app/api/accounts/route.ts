import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseJsonBody, parseBody, tryCatchDb, toResponse } from '@/lib/result'
import { createAccountBody } from '@/lib/schemas'
import { NotFoundError } from '@/lib/errors'

export async function GET() {
  return pipe(
    tryCatchDb(
      () => prisma.account.findMany({
        include: {
          category: true,
          snapshots: {
            orderBy: [
              { year: 'desc' },
              { month: 'desc' }
            ],
            take: 1
          }
        },
        orderBy: [
          { name: 'asc' }
        ]
      })
    ),
    (te) => toResponse(te)
  )
}

export async function POST(request: NextRequest) {
  return pipe(
    parseJsonBody(request),
    TE.chain((body) => TE.fromEither(parseBody(createAccountBody)(body))),
    TE.chain((validated) =>
      pipe(
        E.tryCatch(
          async () => {
            const category = await prisma.accountCategory.findUnique({
              where: { id: validated.categoryId }
            })
            if (!category) {
              throw new Error('Account category not found')
            }
            return category
          },
          () => NotFoundError('AccountCategory', validated.categoryId)
        ),
        TE.fromEither,
        TE.chain(() =>
          tryCatchDb(
            () => prisma.account.create({
              data: {
                name: validated.name.trim(),
                type: validated.type,
                categoryId: validated.categoryId,
              },
              include: {
                category: true
              }
            })
          )
        )
      )
    ),
    (te) => toResponse(te, 201)
  )
}
