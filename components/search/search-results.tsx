import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Bell } from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import type { SearchResult } from "@/lib/search"

interface SearchResultsProps {
  results: SearchResult[]
  query: string
}

export function SearchResults({ results, query }: SearchResultsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/70 font-medium">
          Found {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;<span className="text-purple-400">{query}</span>&rdquo;
        </p>
      </div>

      <div className="space-y-6">
        {results.map((insight) => {
          const upcomingReminder = insight.reminders?.[0]

          return (
          <Link key={insight.id} href={`/dashboard/insights/${insight.id}`}>
            <Card className="p-6 hover:shadow-2xl hover:scale-[1.01] transition-all cursor-pointer group border-2 border-white/20 bg-slate-900/95 backdrop-blur-sm hover:border-white/40">
              <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-purple-400 transition-colors">
                    {insight.title}
                  </h3>
                      <p className="text-base text-white/70 leading-relaxed line-clamp-2">
                        {insight.takeaway}
                      </p>
                    </div>
                    {typeof insight.similarity === "number" && (
                      <Badge variant="outline" className="whitespace-nowrap ml-auto bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300 font-semibold">
                        Match {(insight.similarity * 100).toFixed(0)}%
                      </Badge>
                    )}
                </div>

                {insight.summary && (
                  <div className="space-y-1.5 pt-2">
                    {insight.summary
                      .split("\n")
                      .slice(0, 2)
                      .map((bullet, i) => (
                        <div key={i} className="flex gap-2 text-sm text-white/60">
                          <span className="text-purple-400 mt-0.5">•</span>
                          <span className="line-clamp-1">{bullet}</span>
                        </div>
                      ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  {insight.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {insight.tags.slice(0, 4).map(({ tag }) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs bg-white/10 text-white/80 border-white/20">
                          {tag.name}
                        </Badge>
                      ))}
                      {insight.tags.length > 4 && (
                        <Badge variant="secondary" className="text-xs bg-white/10 text-white/80 border-white/20">
                          +{insight.tags.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-white/60 ml-auto">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true })}
                  </div>
                </div>

                  {upcomingReminder && (
                    <div className="flex items-center gap-2 rounded-md border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-2 text-xs text-purple-300">
                      <Bell className="h-3 w-3" />
                      Reminder {format(new Date(upcomingReminder.dueAt), "MMM d, yyyy h:mm a")}
                    </div>
                  )}
              </div>
            </Card>
          </Link>
          )
        })}
      </div>
    </div>
  )
}
