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
    <Card className="p-6 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group min-w-0 border-2 border-white/20 bg-slate-900/95 backdrop-blur-sm hover:border-white/40">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-purple-400 transition-colors line-clamp-2">
            {insight.title}
          </h3>
          <p className="text-sm text-white/70 line-clamp-3">{insight.takeaway}</p>
        </div>

        {insight.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {insight.tags.slice(0, 3).map(({ tag }) => (
              <Badge key={tag.id} variant="secondary" className="text-xs whitespace-normal break-words bg-white/10 text-white/80 border-white/20">
                {tag.name}
              </Badge>
            ))}
            {insight.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-white/10 text-white/80 border-white/20">
                +{insight.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-white/60">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true })}
        </div>
        {upcomingReminder && (
          <div className="flex items-center gap-2 text-xs rounded-md border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-2 text-purple-300">
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
