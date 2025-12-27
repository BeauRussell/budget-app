import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import type { ZodSchema } from 'zod'
import { NextResponse, type NextRequest } from 'next/server'
import type { AppError } from './errors'
import { zodErrorToAppError, errorToStatus, errorToBody, logError, UnexpectedError, DatabaseError } from './errors'

export const parseBody = <T>(schema: ZodSchema<T>) => (body: unknown): E.Either<AppError, T> => {
  const result = schema.safeParse(body)
  if (result.success) {
    return E.right(result.data)
  }
  return E.left(zodErrorToAppError(result.error.issues))
}

export const parseQuery = <T>(schema: ZodSchema<T>) => (params: URLSearchParams): E.Either<AppError, T> => {
  const obj: Record<string, string | null> = {}
  params.forEach((value, key) => {
    obj[key] = value
  })
  const result = schema.safeParse(obj)
  if (result.success) {
    return E.right(result.data)
  }
  return E.left(zodErrorToAppError(result.error.issues))
}

export const parseJsonBody = (request: NextRequest): TE.TaskEither<AppError, unknown> => {
  return TE.tryCatch(
    async () => {
      try {
        return await request.json()
      } catch {
        throw new Error('Failed to parse request body')
      }
    },
    () => UnexpectedError('Failed to parse request body')
  )
}

export const tryCatchDb = <A>(
  operation: () => Promise<A>,
  onError?: (error: unknown) => AppError
): TE.TaskEither<AppError, A> => {
  return TE.tryCatch(operation, (error) => {
    if (onError) {
      return onError(error)
    }
    if (error instanceof Error && error.message.includes('Record not found')) {
      return DatabaseError('Record not found', error)
    }
    return DatabaseError('Database operation failed', error)
  })
}

export const toResponse = <A>(
  te: TE.TaskEither<AppError, A>,
  successStatus: number = 200
): Promise<NextResponse> => {
  return pipe(
    te,
    TE.mapLeft((error) => {
      logError(error)
      return error
    })
  )().then(
    (result) => {
      if (E.isRight(result)) {
        return NextResponse.json(result.right, { status: successStatus })
      }
      const error = result.left
      const status = errorToStatus(error)
      return NextResponse.json(errorToBody(error), { status })
    }
  )
}

export const toResponseWithData = <A>(
  te: TE.TaskEither<AppError, A>,
  successStatus: number = 200
): Promise<NextResponse> => {
  return toResponse(te, successStatus)
}

export const requireId = (params: { id: string }): E.Either<AppError, string> => {
  if (!params.id || params.id.trim() === '') {
    return E.left({ _tag: 'ValidationError', message: 'ID is required', issues: [{ path: 'id', message: 'ID is required' }] })
  }
  return E.right(params.id)
}
