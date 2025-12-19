import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.accountCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { accounts: true }
        }
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching account categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch account categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const category = await prisma.accountCategory.create({
      data: {
        name: name.trim(),
        type: type || "ASSET",
        isDefault: false,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating account category:', error)
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create account category' },
      { status: 500 }
    )
  }
}