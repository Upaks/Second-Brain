import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { add = [], remove = [] } = body

    // Verify collection ownership
    const collection = await prisma.collection.findUnique({
      where: { id, userId: user.id },
    })

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    // Add insights
    for (const insightId of add) {
      // Verify insight ownership
      const insight = await prisma.insight.findUnique({
        where: { id: insightId, userId: user.id },
      })

      if (!insight) continue

      await prisma.collectionOnInsight.upsert({
        where: {
          collectionId_insightId: {
            collectionId: id,
            insightId,
          },
        },
        create: {
          collectionId: id,
          insightId,
        },
        update: {},
      })
    }

    // Remove insights
    if (remove.length > 0) {
      await prisma.collectionOnInsight.deleteMany({
        where: {
          collectionId: id,
          insightId: {
            in: remove,
          },
        },
      })
    }

    // Update collection timestamp
    await prisma.collection.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Collection insights update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
