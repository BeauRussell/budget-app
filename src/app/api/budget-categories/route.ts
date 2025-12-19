import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.budgetCategory.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { entries: true }
        }
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching budget categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Get the max sort order
    const maxSortOrder = await prisma.budgetCategory.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    const category = await prisma.budgetCategory.create({
      data: {
        name: name.trim(),
        sortOrder: (maxSortOrder?.sortOrder || 0) + 1
      },
      include: {
        _count: {
          select: { entries: true }
        }
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating budget category:', error)
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create budget category' },
      { status: 500 }
    )
  }
}