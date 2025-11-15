import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { CaptureComposer } from "@/components/capture/capture-composer"
import { InsightList, type InsightListItem } from "@/components/insights/insight-list"
import { prisma } from "@/lib/db"

export default async function DashboardPage() {
  const user = await requireCurrentUser()

  // Fetch a lightweight set of recent insights for the cards
  const insights = await prisma.insight.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
      takeaway: true,
      createdAt: true,
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      reminders: {
        select: {
          id: true,
          dueAt: true,
        },
        where: {
          sentAt: null,
        },
        orderBy: {
          dueAt: "asc",
        },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 9,
  })

  const formattedInsights: InsightListItem[] = insights.map((insight) => ({
    ...insight,
    reminders: insight.reminders ?? [],
  }))

  return (
    <DashboardShell user={user}>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Capture</h1>
          <p className="text-muted-foreground text-lg">
            Save ideas, links, files, or audio — we&apos;ll turn them into insights
          </p>
        </div>

        <CaptureComposer userId={user.id} />

        <div className="pt-8">
          <h2 className="text-2xl font-semibold mb-6">Recent Insights</h2>
          <InsightList insights={formattedInsights} />
        </div>
      </div>
    </DashboardShell>
  )
}
