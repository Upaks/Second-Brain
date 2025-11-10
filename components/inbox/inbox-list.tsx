import { Empty, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { InboxItem } from "./inbox-item"
import { Inbox } from "lucide-react"
import type { IngestItem, Insight, Tag, InsightTag } from "@prisma/client"

export type InboxIngestItem = IngestItem & {
  insights: Array<
    Insight & {
      tags: (InsightTag & { tag: Tag })[]
    }
  >
}

interface InboxListProps {
  items: InboxIngestItem[]
}

export function InboxList({ items }: InboxListProps) {
  if (items.length === 0) {
    return (
      <Empty>
        <EmptyIcon>
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </EmptyIcon>
        <EmptyTitle>Inbox is empty</EmptyTitle>
        <EmptyDescription>Captured items will appear here while they&apos;re being processed</EmptyDescription>
      </Empty>
    )
  }

  const pending = items.filter((i) => i.status === "PENDING" || i.status === "PROCESSING")
  const done = items.filter((i) => i.status === "DONE")

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Processing ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((item) => (
              <InboxItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recently Processed ({done.length})</h2>
          <div className="space-y-3">
            {done.map((item) => (
              <InboxItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
