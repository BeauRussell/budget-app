import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, isActive, type } = body

    const updateData: { name?: string; isActive?: boolean; type?: string } = {}
    
    if (name !== undefined) {
      if (name.trim() === '') {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }
    
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive
    }

    if (type !== undefined) {
      const validTypes = ['NEED', 'WANT', 'SAVING']
      if (validTypes.includes(type)) {
        updateData.type = type
      } else {
        return NextResponse.json(
          { error: 'Invalid type. Must be NEED, WANT, or SAVING' },
          { status: 400 }
        )
      }
    }

    const category = await prisma.budgetCategory.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { entries: true }
        }
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating budget category:', error)
    
    if (error instanceof Error && error.message.includes('Record not found')) {
      return NextResponse.json(
        { error: 'Budget category not found' },
        { status: 404 }
      )
    }
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update budget category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    // Check if category has any entries
    const entryCount = await prisma.budgetEntry.count({
      where: { categoryId: id }
    })

    if (entryCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing budget entries. Deactivate it instead.' },
        { status: 400 }
      )
    }

    await prisma.budgetCategory.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting budget category:', error)
    
    if (error instanceof Error && error.message.includes('Record not found')) {
      return NextResponse.json(
        { error: 'Budget category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete budget category' },
      { status: 500 }
    )
  }
}