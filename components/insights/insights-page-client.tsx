"use client"

import { useEffect, useMemo, useState } from "react"

import { InsightFilters } from "./insight-filters"
import { InsightGrid, type InsightGridItem, type AvailableTag } from "./insight-grid"

interface InsightsPageClientProps {
  initialInsights: InsightGridItem[]
  tags: AvailableTag[]
  selectedTag?: string
}

export function InsightsPageClient({ initialInsights, tags, selectedTag }: InsightsPageClientProps) {
  const [insights, setInsights] = useState<InsightGridItem[]>(initialInsights)

  useEffect(() => {
    setInsights(initialInsights)
  }, [initialInsights])

  const count = insights.length

  const tagIds = useMemo(() => tags.map((tag) => tag.id).join(","), [tags])

  const handleDeleted = (ids: string[]) => {
    if (ids.length === 0) return
    setInsights((current) => current.filter((insight) => !ids.includes(insight.id)))
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">All Insights</h1>
          <p className="text-muted-foreground text-lg">
            {count} {count === 1 ? "insight" : "insights"} in your knowledge base
          </p>
        </div>
      </div>

      {/* key ensures filters rerender if tags change after refresh */}
      <InsightFilters key={tagIds} tags={tags} selectedTag={selectedTag} />

      <InsightGrid insights={insights} availableTags={tags} onDeleted={handleDeleted} />
    </div>
  )
}

