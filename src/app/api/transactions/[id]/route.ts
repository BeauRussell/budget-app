import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { category: true }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { date, amount, vendor, description, categoryId, isRecurring } = body

    const updateData: {
      date?: Date;
      amount?: number;
      vendor?: string | null;
      description?: string | null;
      categoryId?: string;
      isRecurring?: boolean;
    } = {}
    if (date) updateData.date = new Date(date)
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (vendor !== undefined) updateData.vendor = vendor
    if (description !== undefined) updateData.description = description
    if (categoryId) updateData.categoryId = categoryId
    if (isRecurring !== undefined) updateData.isRecurring = !!isRecurring

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: { category: true }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
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
    await prisma.transaction.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}
