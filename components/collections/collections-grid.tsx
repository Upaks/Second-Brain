import { Empty, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { CollectionCard } from "./collection-card"
import { Folder } from "lucide-react"

type CollectionSummary = {
  id: string
  name: string
  description: string | null
  color: string | null
  updatedAt: Date
  insightCount: number
}

interface CollectionsGridProps {
  collections: CollectionSummary[]
}

export function CollectionsGrid({ collections }: CollectionsGridProps) {
  if (collections.length === 0) {
    return (
      <Empty>
        <EmptyIcon>
          <Folder className="h-8 w-8 text-muted-foreground" />
        </EmptyIcon>
        <EmptyTitle>No collections yet</EmptyTitle>
        <EmptyDescription>Create collections to organize your insights by topic, project, or theme</EmptyDescription>
      </Empty>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  )
}
