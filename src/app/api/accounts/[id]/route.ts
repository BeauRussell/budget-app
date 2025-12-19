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
    const { name, type, categoryId, isActive } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (type && !['ASSET', 'DEBT'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be ASSET or DEBT' },
        { status: 400 }
      )
    }

    if (categoryId) {
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
    }

    const account = await prisma.account.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(type && { type }),
        ...(categoryId && { categoryId }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error updating account:', error)
    
    if (error instanceof Error && error.message.includes('Record not found')) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update account' },
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

    // Check if account has any snapshots (history)
    const snapshotCount = await prisma.netWorthSnapshot.count({
      where: { accountId: id }
    })

    if (snapshotCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with existing snapshots. Deactivate it instead.' },
        { status: 400 }
      )
    }

    await prisma.account.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    
    if (error instanceof Error && error.message.includes('Record not found')) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}