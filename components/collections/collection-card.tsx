import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Folder, FileText } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Collection, CollectionOnInsight, Insight } from "@prisma/client"

interface CollectionWithInsights extends Collection {
  insights: (CollectionOnInsight & {
    insight: Insight
  })[]
}

interface CollectionCardProps {
  collection: CollectionWithInsights
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={`/dashboard/collections/${collection.id}`}>
      <Card className="p-6 h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
        <div className="flex flex-col h-full space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-accent/10">
              <Folder className="h-6 w-6 text-accent" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {collection.name}
              </h3>
              {collection.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{collection.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t mt-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {collection.insights.length} {collection.insights.length === 1 ? "insight" : "insights"}
            </div>

            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(collection.updatedAt), { addSuffix: true })}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
