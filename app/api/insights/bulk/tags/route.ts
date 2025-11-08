import { type NextRequest, NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/db"

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []

  return Array.from(
    new Set(
      tags
        .map((tag) => (typeof tag === "string" ? tag : ""))
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 1 && tag.length <= 40),
    ),
  )
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const insightIds = Array.isArray(body?.insightIds) ? (body.insightIds as string[]) : []
    const action = body?.action === "add" || body?.action === "remove" ? (body.action as "add" | "remove") : null
    const tags = normalizeTags(body?.tags)

    if (!action) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (insightIds.length === 0) {
      return NextResponse.json({ error: "No insights selected" }, { status: 400 })
    }

    if (tags.length === 0) {
      return NextResponse.json({ error: "At least one tag is required" }, { status: 400 })
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

    if (ownedInsights.length !== insightIds.length) {
      return NextResponse.json({ error: "One or more insights were not found" }, { status: 404 })
    }

    const ownedIds = ownedInsights.map((insight) => insight.id)

    if (action === "add") {
      const tagRecords = await Promise.all(
        tags.map((name) =>
          prisma.tag.upsert({
            where: {
              userId_name: {
                userId: user.id,
                name,
              },
            },
            create: {
              userId: user.id,
              name,
            },
            update: {},
          }),
        ),
      )

      for (const tag of tagRecords) {
        await prisma.insightTag.createMany({
          data: ownedIds.map((insightId) => ({
            insightId,
            tagId: tag.id,
          })),
          skipDuplicates: true,
        })
      }

      return NextResponse.json({ success: true, updated: ownedIds.length })
    }

    const tagRecords = await prisma.tag.findMany({
      where: {
        userId: user.id,
        name: {
          in: tags,
        },
      },
      select: {
        id: true,
      },
    })

    if (tagRecords.length === 0) {
      return NextResponse.json({ success: true, updated: 0 })
    }

    const deleted = await prisma.insightTag.deleteMany({
      where: {
        insightId: {
          in: ownedIds,
        },
        tagId: {
          in: tagRecords.map((tag) => tag.id),
        },
      },
    })

    return NextResponse.json({ success: true, updated: deleted.count })
  } catch (error) {
    console.error("[v0] Bulk tag update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

