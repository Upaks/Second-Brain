import { Empty, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { InsightCard } from "./insight-card"
import { Lightbulb } from "lucide-react"
import type { Insight, Tag, InsightTag, IngestItem, Reminder } from "@prisma/client"

interface InsightWithTags extends Insight {
  tags: (InsightTag & { tag: Tag })[]
  ingestItem: IngestItem | null
  reminders: Reminder[]
}

interface InsightListProps {
  insights: InsightWithTags[]
}

export function InsightList({ insights }: InsightListProps) {
  if (insights.length === 0) {
    return (
      <Empty>
        <EmptyIcon>
          <Lightbulb className="h-8 w-8 text-muted-foreground" />
        </EmptyIcon>
        <EmptyTitle>No insights yet</EmptyTitle>
        <EmptyDescription>Start capturing your ideas, links, and files to build your knowledge base</EmptyDescription>
      </Empty>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  )
}
