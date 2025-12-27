import { z } from 'zod'
import { monthYearQuery } from './common'

export const getTransactionsQuery = monthYearQuery.extend({
  categoryId: z.string().optional(),
  search: z.string().optional(),
})

export const createTransactionBody = z.object({
  date: z.string().datetime(),
  amount: z.coerce.number(),
  vendor: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  categoryId: z.string().min(1),
  isRecurring: z.boolean().optional().default(false),
})

export const updateTransactionBody = z.object({
  date: z.string().datetime().optional(),
  amount: z.coerce.number().optional(),
  vendor: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  categoryId: z.string().optional(),
  isRecurring: z.boolean().optional(),
})
