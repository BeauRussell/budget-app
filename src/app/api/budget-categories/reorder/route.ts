import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderedIds } = body

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: 'orderedIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Update all categories in a transaction
    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.budgetCategory.update({
          where: { id },
          data: { sortOrder: index + 1 }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering budget categories:', error)
    return NextResponse.json(
      { error: 'Failed to reorder budget categories' },
      { status: 500 }
    )
  }
}