import { z } from 'zod'

export const saveBudgetEntriesBody = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  entries: z.array(z.object({
    categoryId: z.string().min(1),
    budgeted: z.coerce.number(),
  })).min(1, 'Entries must be a non-empty array'),
})
