import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()

    // Find due reminders
    const dueReminders = await prisma.reminder.findMany({
      where: {
        dueAt: { lte: now },
        sentAt: null,
      },
      include: {
        user: true,
        insight: true,
      },
      take: 100,
    })

    console.log(`[v0] Found ${dueReminders.length} due reminders`)

    // In production: send actual emails via Resend/SendGrid
    // For MVP: just mark as sent
    for (const reminder of dueReminders) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sentAt: now },
      })

      console.log(`[v0] Sent reminder ${reminder.id} to ${reminder.user.email}`)
    }

    return NextResponse.json({
      success: true,
      sent: dueReminders.length,
    })
  } catch (error) {
    console.error("[v0] Cron reminders error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
