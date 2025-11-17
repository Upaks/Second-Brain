import { CollectionsGrid } from "./collections-grid"
import { CreateCollectionButton } from "./create-collection-button"
import { getCollectionsOverview } from "@/lib/data/dashboard"

interface CollectionsStreamSectionProps {
  userId: string
}

export async function CollectionsStreamSection({ userId }: CollectionsStreamSectionProps) {
  const collections = await getCollectionsOverview(userId)

  return (
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
  )
}

