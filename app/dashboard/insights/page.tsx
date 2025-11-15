import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InsightsPageClient } from "@/components/insights/insights-page-client"
import { prisma } from "@/lib/db"
import type { InsightGridItem, AvailableTag } from "@/components/insights/insight-grid"

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const user = await requireCurrentUser()
  const params = await searchParams

  // Build query
  const where: Record<string, unknown> = { userId: user.id }
  if (params.tag) {
    where.tags = {
      some: {
        tag: {
          name: params.tag,
        },
      },
    }
  }

  const insightsRaw = await prisma.insight.findMany({
    where,
    select: {
      id: true,
      title: true,
      takeaway: true,
      summary: true,
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
      _count: {
        select: {
          linksTo: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const formattedInsights: InsightGridItem[] = insightsRaw.map(({ summary, _count, reminders, ...rest }) => ({
    ...rest,
    reminders: reminders ?? [],
    summaryPreview: summary
      ? summary
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [],
    linkCount: _count.linksTo,
  }))

  const allTagsRaw = await prisma.tag.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  })

  const tags: AvailableTag[] = allTagsRaw

  return (
    <DashboardShell user={user}>
      <InsightsPageClient initialInsights={formattedInsights} tags={tags} selectedTag={params.tag} />
    </DashboardShell>
  )
}
