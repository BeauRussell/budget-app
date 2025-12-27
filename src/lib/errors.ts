import type { ZodIssue } from 'zod'

export type AppError =
  | { _tag: 'ValidationError'; message: string; issues: Array<{ path: string; message: string }> }
  | { _tag: 'NotFoundError'; resource: string; id: string }
  | { _tag: 'ConflictError'; message: string; resource: string }
  | { _tag: 'ConstraintError'; message: string; constraint: string }
  | { _tag: 'DatabaseError'; message: string; cause?: unknown }
  | { _tag: 'UnexpectedError'; message: string; cause?: unknown }

export const ValidationError = (
  message: string,
  issues: Array<{ path: string; message: string }>
): AppError => ({
  _tag: 'ValidationError',
  message,
  issues,
})

export const NotFoundError = (resource: string, id: string): AppError => ({
  _tag: 'NotFoundError',
  resource,
  id,
})

export const ConflictError = (message: string, resource: string): AppError => ({
  _tag: 'ConflictError',
  message,
  resource,
})

export const ConstraintError = (message: string, constraint: string): AppError => ({
  _tag: 'ConstraintError',
  message,
  constraint,
})

export const DatabaseError = (message: string, cause?: unknown): AppError => ({
  _tag: 'DatabaseError',
  message,
  cause,
})

export const UnexpectedError = (message: string, cause?: unknown): AppError => ({
  _tag: 'UnexpectedError',
  message,
  cause,
})

export const zodErrorToAppError = (issues: ZodIssue[]): AppError => {
  return ValidationError('Validation failed', issues.map((e) => ({
    path: e.path.join('.'),
    message: e.message,
  })))
}

export const errorToStatus = (error: AppError): number => {
  switch (error._tag) {
    case 'ValidationError':
      return 400
    case 'NotFoundError':
      return 404
    case 'ConflictError':
      return 409
    case 'ConstraintError':
      return 400
    case 'DatabaseError':
      return 500
    case 'UnexpectedError':
      return 500
  }
}

export const errorToBody = (error: AppError): { error: AppError } => ({ error })

export const logError = (error: AppError, context?: string): void => {
  const contextStr = context ? `[${context}] ` : ''
  switch (error._tag) {
    case 'ValidationError':
      console.error(`${contextStr}Validation error: ${error.message}`, error.issues)
      break
    case 'NotFoundError':
      console.error(`${contextStr}Not found: ${error.resource} with id ${error.id}`)
      break
    case 'ConflictError':
      console.error(`${contextStr}Conflict: ${error.message}`, error.resource)
      break
    case 'ConstraintError':
      console.error(`${contextStr}Constraint error: ${error.message}`, error.constraint)
      break
    case 'DatabaseError':
      console.error(`${contextStr}Database error: ${error.message}`, error.cause)
      break
    case 'UnexpectedError':
      console.error(`${contextStr}Unexpected error: ${error.message}`, error.cause)
      break
  }
}
