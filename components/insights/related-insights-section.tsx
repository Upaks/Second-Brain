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
    <Card className="p-6 border-2 border-white/20 bg-slate-900/95 backdrop-blur-sm">
      <h3 className="font-semibold flex items-center gap-2 mb-6 text-white">
        <Link2 className="h-5 w-5 text-purple-400" />
        Suggested Insights ({related.length})
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {related.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/insights/${item.id}`}
            className="p-4 rounded-xl border-2 border-white/20 bg-slate-800/50 hover:bg-slate-800/70 hover:border-white/40 transition-all group"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold mb-2 line-clamp-2 text-white group-hover:text-purple-400 transition-colors">{item.title}</h4>
                <p className="text-sm text-white/70 line-clamp-1">{item.takeaway}</p>
              </div>
              {typeof item.similarity === "number" && (
                <Badge variant="outline" className="ml-auto whitespace-nowrap bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300 font-semibold">
                  Match {(item.similarity * 100).toFixed(0)}%
                </Badge>
              )}
            </div>
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                {item.tags.slice(0, 3).map(({ tag }) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs bg-white/10 text-white border-white/20">
                    {tag.name}
                  </Badge>
                ))}
                {item.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs bg-white/10 text-white border-white/20">
                    +{item.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </Card>
  )
}

