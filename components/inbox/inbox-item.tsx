import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { FileText, LinkIcon, ImageIcon, Music, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { IngestItem, Insight, Tag, InsightTag } from "@prisma/client"

interface IngestItemWithInsight extends IngestItem {
  insight:
    | (Insight & {
        tags: (InsightTag & { tag: Tag })[]
      })
    | null
}

const typeIcons = {
  TEXT: FileText,
  URL: LinkIcon,
  PDF: FileText,
  IMAGE: ImageIcon,
  AUDIO: Music,
}

const statusConfig = {
  PENDING: { label: "Pending", color: "bg-pending/10 text-pending border-pending/20", icon: Spinner },
  PROCESSING: { label: "Processing", color: "bg-processing/10 text-processing border-processing/20", icon: Spinner },
  DONE: { label: "Done", color: "bg-done/10 text-done border-done/20", icon: CheckCircle },
  ERROR: { label: "Error", color: "bg-error/10 text-error border-error/20", icon: AlertCircle },
}

interface InboxItemProps {
  item: IngestItemWithInsight
}

export function InboxItem({ item }: InboxItemProps) {
  const Icon = typeIcons[item.type]
  const status = statusConfig[item.status]
  const StatusIcon = status.icon

  const content = item.insight ? (
    <Link href={`/dashboard/insights/${item.insight.id}`} className="block group">
      <Card className="p-4 hover:shadow-md hover:border-primary/50 transition-all">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium mb-1 line-clamp-1 group-hover:text-primary transition-colors">
              {item.insight.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{item.insight.takeaway}</p>

            <div className="flex items-center gap-3 mt-3">
              {item.insight.tags.length > 0 && (
                <div className="flex gap-1">
                  {item.insight.tags.slice(0, 3).map(({ tag }) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}

              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 ${status.color}`}
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
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium mb-1 line-clamp-1">{item.type} Item</h3>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </p>
        </div>

        <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 ${status.color}`}>
          {(item.status === "PENDING" || item.status === "PROCESSING") && <StatusIcon size="sm" className="h-3 w-3" />}
          {status.label}
        </div>
      </div>
    </Card>
  )

  return content
}
