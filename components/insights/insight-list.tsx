import { Empty, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { InsightCard } from "./insight-card"
import { Lightbulb } from "lucide-react"

export type InsightListItem = {
  id: string
  title: string
  takeaway: string
  createdAt: Date
  tags: { tag: { id: string; name: string } }[]
  reminders: { id: string; dueAt: Date }[]
}

interface InsightListProps {
  insights: InsightListItem[]
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
