import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { FileText, LinkIcon, ImageIcon, Music, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { IngestItem, Insight, Tag, InsightTag } from "@prisma/client"

interface IngestItemWithInsights extends IngestItem {
  insights: Array<
    Insight & {
      tags: (InsightTag & { tag: Tag })[]
    }
  >
}

const typeIcons = {
  TEXT: FileText,
  URL: LinkIcon,
  PDF: FileText,
  IMAGE: ImageIcon,
  AUDIO: Music,
}

const statusConfig = {
  PENDING: { label: "Pending", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", icon: Spinner },
  PROCESSING: { label: "Processing", color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: Spinner },
  DONE: { label: "Done", color: "bg-green-500/20 text-green-300 border-green-500/30", icon: CheckCircle },
  ERROR: { label: "Error", color: "bg-red-500/20 text-red-300 border-red-500/30", icon: AlertCircle },
}

interface InboxItemProps {
  item: IngestItemWithInsights
}

export function InboxItem({ item }: InboxItemProps) {
  const Icon = typeIcons[item.type]
  const status = statusConfig[item.status]
  const StatusIcon = status.icon
  const primaryInsight = item.insights?.[0] ?? null
  const content = primaryInsight ? (
    <Link href={`/dashboard/insights/${primaryInsight.id}`} className="block group">
      <Card className="p-6 hover:shadow-2xl hover:scale-[1.01] transition-all border-2 border-white/20 bg-slate-900/95 backdrop-blur-sm hover:border-white/40">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10">
            <Icon className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-2 text-white line-clamp-1 group-hover:text-purple-400 transition-colors">
              {primaryInsight.title}
            </h3>
            <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">{primaryInsight.takeaway}</p>

            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/10">
              {primaryInsight.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 flex-1 min-w-0">
                  {primaryInsight.tags.slice(0, 3).map(({ tag }) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs whitespace-normal break-words bg-white/10 text-white/80 border-white/20">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}

              <span className="text-xs text-white/60 ml-auto whitespace-nowrap">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap ${status.color}`}
          >
            {(item.status === "PENDING" || item.status === "PROCESSING") && (
              <StatusIcon size="sm" className="h-3 w-3" />
            )}
            {item.status === "DONE" && <StatusIcon className="h-3 w-3" />}
            {item.status === "ERROR" && <StatusIcon className="h-3 w-3" />}
            {status.label}
          </div>
        </div>
      </Card>
    </Link>
  ) : (
    <Card className="p-6 border-2 border-white/20 bg-slate-900/95 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10">
          <Icon className="h-5 w-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1 text-white line-clamp-1">{item.type} Item</h3>
          <p className="text-sm text-white/60">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </p>
        </div>

        <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap ${status.color}`}>
          {(item.status === "PENDING" || item.status === "PROCESSING") && <StatusIcon size="sm" className="h-3 w-3" />}
          {status.label}
        </div>
      </div>
    </Card>
  )

  return content
}
