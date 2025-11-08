import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { RemindersList } from "@/components/reminders/reminders-list"
import { prisma } from "@/lib/db"

export default async function RemindersPage() {
  const user = await requireCurrentUser()

  const now = new Date()

  const upcomingReminders = await prisma.reminder.findMany({
    where: {
      userId: user.id,
      sentAt: null,
      dueAt: {
        gte: now,
      },
    },
    include: {
      insight: {
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      },
    },
    orderBy: { dueAt: "asc" },
  })

  const pastReminders = await prisma.reminder.findMany({
    where: {
      userId: user.id,
      OR: [
        { sentAt: { not: null } },
        {
          sentAt: null,
          dueAt: { lt: now },
        },
      ],
    },
    include: {
      insight: {
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      },
    },
    orderBy: { dueAt: "desc" },
    take: 20,
  })

  return (
    <DashboardShell user={user}>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Reminders</h1>
          <p className="text-muted-foreground text-lg">Never let important insights slip through the cracks</p>
        </div>

        <RemindersList upcoming={upcomingReminders} past={pastReminders} />
      </div>
    </DashboardShell>
  )
}
