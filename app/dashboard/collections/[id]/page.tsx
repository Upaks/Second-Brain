import { notFound } from "next/navigation"
import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { CollectionDetail } from "@/components/collections/collection-detail"
import { prisma } from "@/lib/db"

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireCurrentUser()
  const { id } = await params

  const collection = await prisma.collection.findUnique({
    where: {
      id,
      userId: user.id,
    },
    include: {
      insights: {
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
        orderBy: {
          addedAt: "desc",
        },
      },
    },
  })

  if (!collection) {
    notFound()
  }

  return (
    <DashboardShell user={user}>
      <CollectionDetail collection={collection} userId={user.id} />
    </DashboardShell>
  )
}
