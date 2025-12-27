import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseJsonBody, parseBody, tryCatchDb, toResponse, requireId } from '@/lib/result'
import { updateBudgetCategoryBody } from '@/lib/schemas'
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
        TE.chain((body) => TE.fromEither(parseBody(updateBudgetCategoryBody)(body))),
        TE.map((validated) => ({ id, validated }))
      )
    ),
    TE.chain(({ id, validated }) =>
      tryCatchDb(
        () => {
          const updateData: { name?: string; isActive?: boolean; type?: string } = {}

          if (validated.name !== undefined) {
            updateData.name = validated.name.trim()
          }

          if (validated.isActive !== undefined) {
            updateData.isActive = validated.isActive
          }

          if (validated.type !== undefined) {
            updateData.type = validated.type
          }

          return prisma.budgetCategory.update({
            where: { id },
            data: updateData,
            include: {
              _count: {
                select: { entries: true }
              }
            }
          })
        },
        (error) => {
          if (error instanceof Error && error.message.includes('Record not found')) {
            return NotFoundError('BudgetCategory', id)
          }
          if (error instanceof Error && error.message.includes('Unique constraint')) {
            return ConflictError('Category name already exists', 'BudgetCategory')
          }
          return { _tag: 'DatabaseError', message: 'Failed to update budget category', cause: error }
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
          const [entryCount, transactionCount] = await Promise.all([
            prisma.budgetEntry.count({
              where: { categoryId: id }
            }),
            (prisma as any).transaction.count({
              where: { categoryId: id }
            })
          ])

          if (entryCount > 0 || transactionCount > 0) {
            throw new Error('Cannot delete category with existing budget entries or transactions. Deactivate it instead.')
          }

          await prisma.budgetCategory.delete({
            where: { id }
          })

          return { success: true }
        },
        (error) => {
          const err = error instanceof Error ? error : new Error(String(error))
          if (err.message.includes('Record not found')) {
            return NotFoundError('BudgetCategory', id)
          }
          if (err.message.includes('Cannot delete category with existing')) {
            return ValidationError(err.message, [{ path: 'category', message: err.message }])
          }
          return { _tag: 'DatabaseError', message: 'Failed to delete budget category', cause: error }
        }
      )
    ),
    TE.fromEither,
    (te) => toResponse(te)
  )
}
