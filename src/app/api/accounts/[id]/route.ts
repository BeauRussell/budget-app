import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseJsonBody, parseBody, tryCatchDb, toResponse, requireId } from '@/lib/result'
import { updateAccountBody } from '@/lib/schemas'
import { NotFoundError } from '@/lib/errors'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return pipe(
    requireId(await params),
    E.chain((id) =>
      E.right({ id, request })
    ),
    TE.fromEither,
    TE.chain(({ id, request }) =>
      pipe(
        parseJsonBody(request),
        TE.chain((body) => TE.fromEither(parseBody(updateAccountBody)(body))),
        TE.map((validated) => ({ id, validated }))
      )
    ),
    TE.chain(({ id, validated }) =>
      pipe(
        validated.categoryId
          ? E.tryCatch(
              async () => {
                const catId = validated.categoryId as string
                const category = await prisma.accountCategory.findUnique({
                  where: { id: catId }
                })
                if (!category) {
                  throw new Error('Account category not found')
                }
                return category
              },
              () => NotFoundError('AccountCategory', validated.categoryId as string)
            )
          : E.right(undefined),
        TE.fromEither,
        TE.chain(() =>
          tryCatchDb(
            () => prisma.account.update({
              where: { id },
              data: {
                name: validated.name.trim(),
                ...(validated.type && { type: validated.type }),
                ...(validated.categoryId && { categoryId: validated.categoryId }),
                ...(typeof validated.isActive === 'boolean' && { isActive: validated.isActive }),
              },
              include: {
                category: true
              }
            }),
            (error) => {
              if (error instanceof Error && error.message.includes('Record not found')) {
                return NotFoundError('Account', id)
              }
              return { _tag: 'DatabaseError', message: 'Failed to update account', cause: error }
            }
          )
        )
      )
    ),
    (te) => toResponse(te)
  )
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  return pipe(
    requireId({ id }),
    E.chain(() =>
      E.tryCatch(
        async () => {
          const snapshotCount = await prisma.netWorthSnapshot.count({
            where: { accountId: id }
          })

          if (snapshotCount > 0) {
            throw new Error('Cannot delete account with existing snapshots. Deactivate it instead.')
          }

          await prisma.account.delete({
            where: { id }
          })

          return { success: true }
        },
        (error) => {
          const err = error instanceof Error ? error : new Error(String(error))
          if (err.message.includes('Record not found')) {
            return NotFoundError('Account', id)
          }
          if (err.message.includes('Cannot delete account with existing snapshots')) {
            return { _tag: 'ConstraintError', message: err.message, constraint: 'snapshots_exist' }
          }
          return { _tag: 'DatabaseError', message: 'Failed to delete account', cause: error }
        }
      )
    ),
    TE.fromEither,
    (te) => toResponse(te)
  )
}
