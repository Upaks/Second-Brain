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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
        </p>
      </div>

      <div className="space-y-4">
        {results.map((insight) => {
          const upcomingReminder = insight.reminders?.[0]

          return (
          <Link key={insight.id} href={`/dashboard/insights/${insight.id}`}>
            <Card className="p-6 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
              <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {insight.title}
                  </h3>
                      <p className="text-base text-muted-foreground leading-relaxed line-clamp-2">
                        {insight.takeaway}
                      </p>
                    </div>
                    {typeof insight.similarity === "number" && (
                      <Badge variant="outline" className="whitespace-nowrap ml-auto">
                        Match {(insight.similarity * 100).toFixed(0)}%
                      </Badge>
                    )}
                </div>

                {insight.summary && (
                  <div className="space-y-1 pt-2">
                    {insight.summary
                      .split("\n")
                      .slice(0, 2)
                      .map((bullet, i) => (
                        <div key={i} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">•</span>
                          <span className="line-clamp-1">{bullet}</span>
                        </div>
                      ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  {insight.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {insight.tags.slice(0, 4).map(({ tag }) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                      {insight.tags.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{insight.tags.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true })}
                  </div>
                </div>

                  {upcomingReminder && (
                    <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
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
