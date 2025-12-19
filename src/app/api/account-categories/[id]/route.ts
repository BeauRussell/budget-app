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
    const { name, type } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const category = await prisma.accountCategory.update({
      where: { id },
      data: { 
        name: name.trim(),
        type: type || "ASSET"
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating account category:', error)
    
    if (error instanceof Error && error.message.includes('Record not found')) {
      return NextResponse.json(
        { error: 'Account category not found' },
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
      { error: 'Failed to update account category' },
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

    // Check if category has any accounts
    const accountCount = await prisma.account.count({
      where: { categoryId: id }
    })

    if (accountCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing accounts' },
        { status: 400 }
      )
    }

    // Cannot delete default categories
    const category = await prisma.accountCategory.findUnique({
      where: { id }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Account category not found' },
        { status: 404 }
      )
    }

    if (category.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default categories' },
        { status: 400 }
      )
    }

    await prisma.accountCategory.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting account category:', error)
    return NextResponse.json(
      { error: 'Failed to delete account category' },
      { status: 500 }
    )
  }
}