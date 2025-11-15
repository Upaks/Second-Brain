import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InsightsPageClient } from "@/components/insights/insights-page-client"
import { prisma } from "@/lib/db"

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const user = await requireCurrentUser()
  const params = await searchParams

  // Build query
  const where: any = { userId: user.id }
  if (params.tag) {
    where.tags = {
      some: {
        tag: {
          name: params.tag,
        },
      },
    }
  }

  const insights = await prisma.insight.findMany({
    where,
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
      linksTo: {
        include: {
          to: {
            include: {
              tags: {
                include: {
                  tag: true,
                },
              },
            },
          },
        },
        take: 3,
      },
      ingestItem: true,
      reminders: {
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
  })

  const allTags = await prisma.tag.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  })

  return (
    <DashboardShell user={user}>
      <InsightsPageClient initialInsights={insights} tags={allTags} selectedTag={params.tag} />
    </DashboardShell>
  )
}
