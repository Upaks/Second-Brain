import { NextResponse, type NextRequest } from "next/server"

import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { queueIngestProcessing } from "@/lib/inngest/events"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { id, resetAll } = body

  // Reset all stuck items (PROCESSING for more than 1 hour)
  if (resetAll) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const stuckItems = await prisma.ingestItem.updateMany({
      where: {
        userId: user.id,
        status: "PROCESSING",
        createdAt: {
          lt: oneHourAgo,
        },
      },
      data: {
        status: "PENDING",
      },
    })

    // Re-queue all reset items
    const resetItemIds = await prisma.ingestItem.findMany({
      where: {
        userId: user.id,
        status: "PENDING",
        createdAt: {
          lt: oneHourAgo,
        },
      },
      select: { id: true },
    })

    for (const item of resetItemIds) {
      await queueIngestProcessing(item.id)
    }

    return NextResponse.json({
      message: `Reset ${stuckItems.count} stuck items`,
      resetCount: stuckItems.count,
    })
  }

  // Reset a specific item
  if (!id) {
    return NextResponse.json({ error: "Missing id or resetAll parameter" }, { status: 400 })
  }

  const item = await prisma.ingestItem.findFirst({
    where: {
      id,
      userId: user.id,
      status: "PROCESSING",
    },
  })

  if (!item) {
    return NextResponse.json({ error: "Item not found or not in PROCESSING status" }, { status: 404 })
  }

  await prisma.ingestItem.update({
    where: { id },
    data: { status: "PENDING" },
  })

  await queueIngestProcessing(id)

  return NextResponse.json({
    message: "Item reset and queued for processing",
    id,
  })
}

