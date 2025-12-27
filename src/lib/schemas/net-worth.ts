import { z } from 'zod'
import { monthYearQuery } from './common'

export const saveSnapshotsBody = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  snapshots: z.array(z.object({
    accountId: z.string().min(1),
    value: z.coerce.number(),
  })).min(1, 'Snapshots must be a non-empty array'),
})

export const getNetWorthQuery = monthYearQuery
