import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { CollectionsGrid } from "@/components/collections/collections-grid"
import { CreateCollectionButton } from "@/components/collections/create-collection-button"
import { prisma } from "@/lib/db"

export default async function CollectionsPage() {
  const user = await requireCurrentUser()

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
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
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <DashboardShell user={user}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Collections</h1>
            <p className="text-muted-foreground text-lg">Organize insights into curated collections</p>
          </div>
          <CreateCollectionButton />
        </div>

        <CollectionsGrid collections={collections} />
      </div>
    </DashboardShell>
  )
}
