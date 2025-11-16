import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { CollectionsGrid } from "@/components/collections/collections-grid"
import { CreateCollectionButton } from "@/components/collections/create-collection-button"
import { getCollectionsOverview } from "@/lib/data/dashboard"

export default async function CollectionsPage() {
  const user = await requireCurrentUser()

  const collections = await getCollectionsOverview(user.id)

  return (
    <DashboardShell user={user}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black mb-3 text-white">Collections</h1>
            <p className="text-white/70 text-lg">Organize insights into curated collections</p>
          </div>
          <CreateCollectionButton />
        </div>

        <CollectionsGrid collections={collections} />
      </div>
    </DashboardShell>
  )
}
