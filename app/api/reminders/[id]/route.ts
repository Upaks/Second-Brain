import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { dueAt, note } = body ?? {}

    if (!dueAt && typeof note === "undefined") {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    const reminder = await prisma.reminder.findUnique({
      where: { id, userId: user.id },
    })

    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 })
    }

    const updateData: { dueAt?: Date; note?: string | null; sentAt?: Date | null } = {}

    if (dueAt) {
      updateData.dueAt = new Date(dueAt)
      updateData.sentAt = null
    }

    if (typeof note !== "undefined") {
      updateData.note = note ?? null
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[v0] Update reminder error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const reminder = await prisma.reminder.findUnique({
      where: { id, userId: user.id },
    })

    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 })
    }

    await prisma.reminder.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete reminder error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
