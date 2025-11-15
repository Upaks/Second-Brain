import { notFound } from "next/navigation"
import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InsightDetail } from "@/components/insights/insight-detail"
import { Suspense } from "react"

import { prisma } from "@/lib/db"
import { RelatedInsightsSection } from "@/components/insights/related-insights-section"
import { RelatedInsightsSkeleton } from "@/components/insights/related-insights-skeleton"

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

  const insight = await insightPromise

  if (!insight) {
    notFound()
  }

  return (
    <DashboardShell user={user}>
      <InsightDetail insight={insight} userId={user.id} />
      <Suspense fallback={<RelatedInsightsSkeleton />}>
        <RelatedInsightsSection insightId={insight.id} userId={user.id} />
      </Suspense>
    </DashboardShell>
  )
}
