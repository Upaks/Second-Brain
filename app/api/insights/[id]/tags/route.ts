import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/db"
import { revalidateInsights, revalidateTags, revalidateFlashcards } from "@/lib/cache/tags"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { add = [], remove = [] } = body

    // Verify insight ownership
    const insight = await prisma.insight.findUnique({
      where: { id, userId: user.id },
    })

    if (!insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 })
    }

    // Add tags
    for (const tagName of add) {
      const tag = await prisma.tag.upsert({
        where: {
          userId_name: {
            userId: user.id,
            name: tagName,
          },
        },
        create: {
          userId: user.id,
          name: tagName,
        },
        update: {},
      })

      await prisma.insightTag.upsert({
        where: {
          insightId_tagId: {
            insightId: id,
            tagId: tag.id,
          },
        },
        create: {
          insightId: id,
          tagId: tag.id,
        },
        update: {},
      })
    }

    // Remove tags
    if (remove.length > 0) {
      await prisma.insightTag.deleteMany({
        where: {
          insightId: id,
          tagId: {
            in: remove,
          },
        },
      })
    }

    revalidateInsights(user.id)
    revalidateTags(user.id)
    revalidateFlashcards(user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Tags update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
