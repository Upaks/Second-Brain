import { notFound } from "next/navigation"
import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InsightDetail } from "@/components/insights/insight-detail"
import { prisma } from "@/lib/db"
import { findRelatedInsights } from "@/lib/search"

export default async function InsightPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireCurrentUser()
  const { id } = await params

  const insightPromise = prisma.insight.findUnique({
    where: {
      id,
      userId: user.id,
    },
    select: {
      id: true,
      userId: true,
      title: true,
      summary: true,
      takeaway: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      tags: {
        include: {
          tag: true,
        },
      },
      linksTo: {
        take: 8,
        select: {
          to: {
            select: {
              id: true,
              title: true,
              takeaway: true,
            },
          },
        },
      },
      linksFrom: {
        take: 8,
        select: {
          from: {
            select: {
              id: true,
              title: true,
              takeaway: true,
            },
          },
        },
      },
      reminders: {
        where: {
          sentAt: null,
        },
        orderBy: {
          dueAt: "asc",
        },
      },
    },
  })

  const relatedPromise = findRelatedInsights(id, user.id)
  const [insight, related] = await Promise.all([insightPromise, relatedPromise])

  if (!insight) {
    notFound()
  }

  return (
    <DashboardShell user={user}>
      <InsightDetail insight={insight} userId={user.id} relatedInsights={related} />
    </DashboardShell>
  )
}
