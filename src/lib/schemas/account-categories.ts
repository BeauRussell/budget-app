import { z } from 'zod'

export const createAccountCategoryBody = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().optional().default('ASSET'),
})

export const updateAccountCategoryBody = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().optional().default('ASSET'),
})
