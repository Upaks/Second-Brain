"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"

import { InsightFilters } from "./insight-filters"
import { InsightGrid } from "./insight-grid"
import type { InsightGridItem, AvailableTag } from "@/types/insights"

interface InsightsPageClientProps {
  initialInsights: InsightGridItem[]
  initialCursor: string | null
  tags: AvailableTag[]
  selectedTag?: string
}

export function InsightsPageClient({ initialInsights, initialCursor, tags, selectedTag }: InsightsPageClientProps) {
  const [insights, setInsights] = useState<InsightGridItem[]>(initialInsights)
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const fetchPage = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams()
      if (cursor) {
        params.set("cursor", cursor)
      }
      if (selectedTag) {
        params.set("tag", selectedTag)
      }
      // Add cache-busting timestamp to ensure we get fresh data
      params.set("_t", Date.now().toString())

      const res = await fetch(`/api/insights/list?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      })

      if (!res.ok) {
        throw new Error("Failed to load insights")
      }

      return (await res.json()) as { items: InsightGridItem[]; nextCursor: string | null }
    },
    [selectedTag],
  )

  useEffect(() => {
    setInsights(initialInsights)
    setNextCursor(initialCursor)
    setError(null)
  }, [initialInsights, initialCursor])

  useEffect(() => {
    const handler = () => {
      startTransition(async () => {
        try {
          setError(null)
          const data = await fetchPage()
          // Set fresh data from server
          setInsights(data.items)
          setNextCursor(data.nextCursor)
        } catch (err) {
          console.error("[v0] Refresh insights error:", err)
          setError(err instanceof Error ? err.message : "Failed to refresh insights.")
        }
      })
    }

    window.addEventListener("insights:invalidate", handler)
    return () => window.removeEventListener("insights:invalidate", handler)
  }, [fetchPage])

  const count = insights.length

  const tagIds = useMemo(() => tags.map((tag) => tag.id).join(","), [tags])

  const handleDeleted = (ids: string[]) => {
    if (ids.length === 0) return
    setInsights((current) => current.filter((insight) => !ids.includes(insight.id)))
  }

  const handleLoadMore = () => {
    if (!nextCursor || isPending) return

    startTransition(async () => {
      try {
        setError(null)
        const data = await fetchPage(nextCursor)
        setInsights((current) => [...current, ...data.items])
        setNextCursor(data.nextCursor)
      } catch (err) {
        console.error("[v0] Load more insights error:", err)
        setError(err instanceof Error ? err.message : "Failed to load more insights.")
      }
    })
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      {nextCursor && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-muted transition-colors"
            disabled={isPending}
          >
            {isPending ? "Loading…" : "Load more insights"}
          </button>
        </div>
      )}
    </div>
  )
}

