import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseJsonBody, parseBody, tryCatchDb, toResponse, requireId } from '@/lib/result'
import { updateAccountCategoryBody } from '@/lib/schemas'
import { NotFoundError, ConflictError, ValidationError } from '@/lib/errors'

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
        TE.chain((body) => TE.fromEither(parseBody(updateAccountCategoryBody)(body))),
        TE.map((validated) => ({ id, validated }))
      )
    ),
    TE.chain(({ id, validated }) =>
      tryCatchDb(
        () => prisma.accountCategory.update({
          where: { id },
          data: {
            name: validated.name.trim(),
            type: validated.type || 'ASSET'
          },
        }),
        (error) => {
          if (error instanceof Error && error.message.includes('Record not found')) {
            return NotFoundError('AccountCategory', id)
          }
          if (error instanceof Error && error.message.includes('Unique constraint')) {
            return ConflictError('Category name already exists', 'AccountCategory')
          }
          return { _tag: 'DatabaseError', message: 'Failed to update account category', cause: error }
        }
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
          const accountCount = await prisma.account.count({
            where: { categoryId: id }
          })

          if (accountCount > 0) {
            throw new Error('Cannot delete category with existing accounts')
          }

          const category = await prisma.accountCategory.findUnique({
            where: { id }
          })

          if (!category) {
            throw new Error('Record not found')
          }

          if (category.isDefault) {
            throw new Error('Cannot delete default categories')
          }

          await prisma.accountCategory.delete({
            where: { id }
          })

          return { success: true }
        },
        (error) => {
          const err = error instanceof Error ? error : new Error(String(error))
          if (err.message.includes('Record not found')) {
            return NotFoundError('AccountCategory', id)
          }
          if (err.message.includes('Cannot delete category with existing accounts')) {
            return ValidationError(err.message, [{ path: 'category', message: err.message }])
          }
          if (err.message.includes('Cannot delete default categories')) {
            return ValidationError(err.message, [{ path: 'category', message: err.message }])
          }
          return { _tag: 'DatabaseError', message: 'Failed to delete account category', cause: error }
        }
      )
    ),
    TE.fromEither,
    (te) => toResponse(te)
  )
}
