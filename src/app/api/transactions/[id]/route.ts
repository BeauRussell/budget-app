import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseBody, tryCatchDb, toResponse, requireId } from '@/lib/result'
import { updateTransactionBody } from '@/lib/schemas'
import { NotFoundError, ValidationError } from '@/lib/errors'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params

  return pipe(
    requireId({ id }),
    TE.fromEither,
    TE.chain((id) =>
      tryCatchDb(
        () => prisma.transaction.findUnique({
          where: { id },
          include: { category: true }
        })
      )
    ),
    TE.chain((transaction) =>
      transaction
        ? TE.right(transaction)
        : TE.left(NotFoundError('Transaction', id))
    ),
    (te) => toResponse(te)
  )
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params

  return pipe(
    requireId({ id }),
    E.chain((id) =>
      E.right({ id, request })
    ),
    TE.fromEither,
    TE.chain(({ id, request }) =>
      pipe(
        TE.tryCatch(
          async () => await request.json(),
          () => ValidationError('Failed to parse request body', [])
        ),
        TE.chain((body) => TE.fromEither(parseBody(updateTransactionBody)(body))),
        TE.map((validated) => ({ id, validated }))
      )
    ),
    TE.chain(({ id, validated }) =>
      tryCatchDb(
        () => {
          const updateData: {
            date?: Date;
            amount?: number;
            vendor?: string | null;
            description?: string | null;
            categoryId?: string;
            isRecurring?: boolean;
          } = {}

          if (validated.date !== undefined) updateData.date = new Date(validated.date)
          if (validated.amount !== undefined) updateData.amount = parseFloat(validated.amount.toString())
          if (validated.vendor !== undefined) updateData.vendor = validated.vendor
          if (validated.description !== undefined) updateData.description = validated.description
          if (validated.categoryId !== undefined) updateData.categoryId = validated.categoryId
          if (validated.isRecurring !== undefined) updateData.isRecurring = validated.isRecurring

          return prisma.transaction.update({
            where: { id },
            data: updateData,
            include: { category: true }
          })
        }
      )
    ),
    (te) => toResponse(te)
  )
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params

  return pipe(
    requireId({ id }),
    TE.fromEither,
    TE.chain((id) =>
      tryCatchDb(
        () => prisma.transaction.delete({
          where: { id }
        })
      )
    ),
    TE.map(() => ({ success: true })),
    (te) => toResponse(te)
  )
}
