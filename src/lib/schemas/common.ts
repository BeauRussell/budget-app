import { z } from 'zod'

export const monthYearQuery = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
})

export const optionalYearQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
})

export const idParam = z.object({
  id: z.string().min(1),
})

export const accountType = z.enum(['ASSET', 'DEBT'])

export const budgetCategoryType = z.enum(['NEED', 'WANT', 'SAVING'])
