import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      include: {
        category: true,
        snapshots: {
          orderBy: [
            { year: 'desc' },
            { month: 'desc' }
          ],
          take: 1
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, categoryId } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!type || !['ASSET', 'DEBT'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be ASSET or DEBT' },
        { status: 400 }
      )
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    // Verify category exists
    const category = await prisma.accountCategory.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Account category not found' },
        { status: 404 }
      )
    }

    const account = await prisma.account.create({
      data: {
        name: name.trim(),
        type,
        categoryId,
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}