import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/db"
import { processIngestItemById } from "@/lib/ingest"
import { queueIngestProcessing } from "@/lib/inngest/events"

export async function POST(request: NextRequest) {
  let ingestItem: Awaited<ReturnType<typeof prisma.ingestItem.create>> | null = null
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { text, source = "manual" } = body

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    ingestItem = await prisma.ingestItem.create({
      data: {
        userId: user.id,
        type: "TEXT",
        source,
        rawText: text,
        status: "PENDING",
      },
    })
    const queued = await queueIngestProcessing(ingestItem.id)
    if (!queued) {
      await processIngestItemById(ingestItem.id)
    }

    return NextResponse.json({ ingestItemId: ingestItem.id, status: queued ? "QUEUED" : "COMPLETED" })
  } catch (error) {
    console.error("[v0] Text ingest error:", error)
    if (ingestItem) {
      await prisma.ingestItem.update({
        where: { id: ingestItem.id },
        data: { status: "ERROR" },
      })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
