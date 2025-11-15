import { type NextRequest, NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/db"
import { revalidateInsights } from "@/lib/cache/tags"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const insightIds = Array.isArray(body?.insightIds) ? (body.insightIds as string[]) : []

    if (insightIds.length === 0) {
      return NextResponse.json({ error: "No insights selected" }, { status: 400 })
    }

    const ownedInsights = await prisma.insight.findMany({
      where: {
        id: {
          in: insightIds,
        },
        userId: user.id,
      },
      select: {
        id: true,
      },
    })

    if (ownedInsights.length === 0) {
      return NextResponse.json({ error: "No insights found" }, { status: 404 })
    }

    const ownedIds = ownedInsights.map((insight) => insight.id)

    await prisma.$transaction([
      prisma.insightLink.deleteMany({
        where: {
          OR: [{ fromId: { in: ownedIds } }, { toId: { in: ownedIds } }],
        },
      }),
      prisma.reminder.deleteMany({
        where: { insightId: { in: ownedIds } },
      }),
      prisma.insightTag.deleteMany({
        where: { insightId: { in: ownedIds } },
      }),
      prisma.file.deleteMany({
        where: { insightId: { in: ownedIds } },
      }),
      prisma.collectionOnInsight.deleteMany({
        where: { insightId: { in: ownedIds } },
      }),
      prisma.insight.deleteMany({
        where: {
          id: {
            in: ownedIds,
          },
          userId: user.id,
        },
      }),
    ])

    revalidateInsights(user.id)
    return NextResponse.json({ success: true, deleted: ownedIds.length })
  } catch (error) {
    console.error("[v0] Bulk delete insights error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

