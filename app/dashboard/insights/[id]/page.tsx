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

  const insight = await prisma.insight.findUnique({
    where: {
      id,
      userId: user.id,
    },
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
      },
      linksFrom: {
        include: {
          from: {
            include: {
              tags: {
                include: {
                  tag: true,
                },
              },
            },
          },
        },
      },
      ingestItem: true,
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

  if (!insight) {
    notFound()
  }

  const related = await findRelatedInsights(insight.id, user.id)

  return (
    <DashboardShell user={user}>
      <InsightDetail insight={insight} userId={user.id} relatedInsights={related} />
    </DashboardShell>
  )
}
