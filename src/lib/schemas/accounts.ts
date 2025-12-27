import { z } from 'zod'
import { accountType } from './common'

export const createAccountBody = z.object({
  name: z.string().min(1, 'Name is required'),
  type: accountType,
  categoryId: z.string().min(1, 'Category is required'),
})

export const updateAccountBody = z.object({
  name: z.string().min(1, 'Name is required'),
  type: accountType.optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
})
