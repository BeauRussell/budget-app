import { z } from 'zod'
import { monthYearQuery } from './common'

export const saveIncomeBody = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  amount: z.coerce.number(),
  note: z.string().nullable().optional(),
})

export const getIncomeQuery = monthYearQuery
