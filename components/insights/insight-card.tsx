import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Bell } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import type { InsightListItem } from "@/types/insights"

interface InsightCardProps {
  insight: InsightListItem
}

export function InsightCard({ insight }: InsightCardProps) {
  const upcomingReminder = insight.reminders?.[0]

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {insight.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3">{insight.takeaway}</p>
        </div>

        {insight.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {insight.tags.slice(0, 3).map(({ tag }) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
            {insight.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{insight.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true })}
        </div>
        {upcomingReminder && (
          <div className="flex items-center gap-2 text-xs rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-primary">
            <Bell className="h-3 w-3" />
            <span className="font-medium">
              Reminder {format(new Date(upcomingReminder.dueAt), "MMM d, yyyy h:mm a")}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}
