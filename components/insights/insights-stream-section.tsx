import { InsightsPageClient } from "./insights-page-client"
import { getAvailableTags, getInsightsGrid } from "@/lib/data/dashboard"

interface InsightsStreamSectionProps {
  userId: string
  selectedTag?: string
}

export async function InsightsStreamSection({ userId, selectedTag }: InsightsStreamSectionProps) {
  const [grid, tags] = await Promise.all([
    getInsightsGrid(userId, { tag: selectedTag }),
    getAvailableTags(userId),
  ])

  return (
    <InsightsPageClient
      initialInsights={grid.items}
      initialCursor={grid.nextCursor}
      tags={tags}
      selectedTag={selectedTag}
    />
  )
}

