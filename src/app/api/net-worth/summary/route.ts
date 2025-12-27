import { pipe } from 'fp-ts/function'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tryCatchDb, toResponse } from '@/lib/result'

export async function GET(_request: NextRequest) {
  return pipe(
    tryCatchDb(
      async () => {
        const snapshots = await prisma.netWorthSnapshot.findMany({
          select: {
            month: true,
            year: true,
          },
          distinct: ['month', 'year'],
          orderBy: [
            { year: 'desc' },
            { month: 'desc' },
          ],
        })

        const years = Array.from(new Set(snapshots.map(s => s.year))).sort((a, b) => b - a)

        return {
          monthsWithData: snapshots,
          years,
        }
      }
    ),
    (te) => toResponse(te)
  )
}
