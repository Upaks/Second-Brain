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
    const { dueAt, note } = body

    if (!dueAt) {
      return NextResponse.json({ error: "dueAt is required" }, { status: 400 })
    }

    // Verify insight ownership
    const insight = await prisma.insight.findUnique({
      where: { id, userId: user.id },
    })

    if (!insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 })
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: user.id,
        insightId: id,
        dueAt: new Date(dueAt),
        kind: "TIME",
        note,
      },
    })

    return NextResponse.json(reminder)
  } catch (error) {
    console.error("[v0] Reminder create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
