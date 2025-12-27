import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseJsonBody, parseBody, tryCatchDb, toResponse } from '@/lib/result'
import { reorderBudgetCategoriesBody } from '@/lib/schemas'

export async function PUT(request: NextRequest) {
  return pipe(
    parseJsonBody(request),
    TE.chain((body) => TE.fromEither(parseBody(reorderBudgetCategoriesBody)(body))),
    TE.chain((validated) =>
      tryCatchDb(
        () => prisma.$transaction(
          validated.orderedIds.map((catId, index) =>
            prisma.budgetCategory.update({
              where: { id: catId },
              data: { sortOrder: index + 1 }
            })
          )
        )
      )
    ),
    TE.map(() => ({ success: true })),
    (te) => toResponse(te)
  )
}
