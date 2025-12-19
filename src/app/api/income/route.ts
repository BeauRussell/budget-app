import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '')
    const year = parseInt(searchParams.get('year') || '')

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      )
    }

    const income = await prisma.monthlyIncome.findUnique({
      where: {
        month_year: { month, year }
      }
    })

    return NextResponse.json(income || { amount: null, note: null })
  } catch (error) {
    console.error('Error fetching income:', error)
    return NextResponse.json(
      { error: 'Failed to fetch income' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, year, amount, note } = body

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      )
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      )
    }

    const existing = await prisma.monthlyIncome.findUnique({
      where: {
        month_year: { month, year }
      }
    })

    let income
    if (existing) {
      income = await prisma.monthlyIncome.update({
        where: { id: existing.id },
        data: {
          amount: parseFloat(amount),
          note: note || null
        }
      })
    } else {
      income = await prisma.monthlyIncome.create({
        data: {
          month,
          year,
          amount: parseFloat(amount),
          note: note || null
        }
      })
    }

    return NextResponse.json(income)
  } catch (error) {
    console.error('Error saving income:', error)
    return NextResponse.json(
      { error: 'Failed to save income' },
      { status: 500 }
    )
  }
}