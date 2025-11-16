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

  // Check on mount if we need to refresh (e.g., after a deletion or new insights)
  useEffect(() => {
    const needsRefresh = sessionStorage.getItem("insights:needsRefresh")
    const lastInsightCreated = sessionStorage.getItem("insights:lastCreated")
    
    // Check if we should refresh:
    // 1. Explicit refresh flag (from deletions)
    // 2. New insights were created recently (within last 30 seconds)
    const shouldRefresh = needsRefresh === "true" || 
      (lastInsightCreated && Date.now() - parseInt(lastInsightCreated) < 30000)
    
    if (shouldRefresh) {
      sessionStorage.removeItem("insights:needsRefresh")
      sessionStorage.removeItem("insights:deletedId")
      // Immediately refetch fresh data
      startTransition(async () => {
        try {
          setError(null)
          const data = await fetchPage()
          setInsights(data.items)
          setNextCursor(data.nextCursor)
        } catch (err) {
          console.error("[v0] Refresh insights error:", err)
          setError(err instanceof Error ? err.message : "Failed to refresh insights.")
        }
      })
    } else {
      // Only sync initialInsights if we don't need a refresh
      setInsights(initialInsights)
      setNextCursor(initialCursor)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount - fetchPage is stable from useCallback

  // Sync initialInsights when they change (but not on initial mount if we're refreshing)
  useEffect(() => {
    const needsRefresh = sessionStorage.getItem("insights:needsRefresh")
    if (needsRefresh !== "true") {
      setInsights(initialInsights)
      setNextCursor(initialCursor)
    }
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
          <h1 className="text-4xl sm:text-5xl font-black mb-3 text-white">All Insights</h1>
          <p className="text-white/70 text-lg">
            {count} {count === 1 ? "insight" : "insights"} in your knowledge base
          </p>
        </div>
      </div>

      {/* key ensures filters rerender if tags change after refresh */}
      <InsightFilters key={tagIds} tags={tags} selectedTag={selectedTag} />

      <InsightGrid insights={insights} availableTags={tags} onDeleted={handleDeleted} />

      {error && <p className="text-sm text-red-400">{error}</p>}

      {nextCursor && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="px-4 py-2 text-sm font-medium rounded-full border border-white/20 bg-slate-900/95 text-white hover:bg-white/10 transition-colors"
            disabled={isPending}
          >
            {isPending ? "Loading…" : "Load more insights"}
          </button>
        </div>
      )}
    </div>
  )
}

