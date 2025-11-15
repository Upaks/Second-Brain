import { cache } from "react"

import { findRelatedInsights } from "@/lib/search"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Link2 } from "lucide-react"

const getRelatedInsights = cache(async (insightId: string, userId: string) => {
  return findRelatedInsights(insightId, userId)
})

export async function RelatedInsightsSection({ insightId, userId }: { insightId: string; userId: string }) {
  const related = await getRelatedInsights(insightId, userId)

  if (!related.length) {
    return null
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold flex items-center gap-2 mb-4">
        <Link2 className="h-4 w-4" />
        Suggested Insights ({related.length})
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {related.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/insights/${item.id}`}
            className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-medium mb-2 line-clamp-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-1">{item.takeaway}</p>
              </div>
              {typeof item.similarity === "number" && (
                <Badge variant="outline" className="ml-auto whitespace-nowrap">
                  Match {(item.similarity * 100).toFixed(0)}%
                </Badge>
              )}
            </div>
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {item.tags.slice(0, 3).map(({ tag }) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </Card>
  )
}

