import { z } from 'zod'
import { budgetCategoryType } from './common'

export const createBudgetCategoryBody = z.object({
  name: z.string().min(1, 'Name is required'),
  type: budgetCategoryType.optional().default('WANT'),
})

export const updateBudgetCategoryBody = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  isActive: z.boolean().optional(),
  type: budgetCategoryType.optional(),
})

export const reorderBudgetCategoriesBody = z.object({
  orderedIds: z.array(z.string()).min(1, 'orderedIds must be a non-empty array'),
})
