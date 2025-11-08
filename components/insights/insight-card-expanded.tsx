import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Link2, Bell } from "lucide-react"
import type { Insight, Tag, InsightTag, IngestItem, InsightLink, Reminder } from "@prisma/client"
import { formatDistanceToNow, format } from "date-fns"

interface InsightWithRelations extends Insight {
  tags: (InsightTag & { tag: Tag })[]
  ingestItem: IngestItem | null
  linksTo: (InsightLink & {
    to: Insight & {
      tags: (InsightTag & { tag: Tag })[]
    }
  })[]
  reminders: Reminder[]
}

interface InsightCardExpandedProps {
  insight: InsightWithRelations
  disableLink?: boolean
}

export function InsightCardExpanded({ insight, disableLink = false }: InsightCardExpandedProps) {
  const upcomingReminder = insight.reminders?.[0]

  const card = (
    <Card
      className={`p-6 h-full transition-all group ${
        disableLink ? "cursor-default" : "hover:shadow-lg hover:border-primary/50 cursor-pointer"
      }`}
    >
      <div className="flex flex-col h-full space-y-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {insight.title}
          </h3>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{insight.takeaway}</p>

          {insight.summary && (
            <div className="space-y-2">
              {insight.summary
                .split("\n")
                .slice(0, 3)
                .map((bullet, i) => (
                  <div key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span className="line-clamp-1">{bullet}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="space-y-3 pt-3 border-t">
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

          <div className="flex items-center justify-between text-xs text-muted-foreground gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true })}
            </div>

            {upcomingReminder && (
              <div className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-primary">
                <Bell className="h-3 w-3" />
                {format(new Date(upcomingReminder.dueAt), "MMM d, h:mm a")}
              </div>
            )}

            {insight.linksTo.length > 0 && (
              <div className="flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                {insight.linksTo.length} linked
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )

  if (disableLink) {
    return card
  }

  return <Link href={`/dashboard/insights/${insight.id}`}>{card}</Link>
}
