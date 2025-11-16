"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { InsightList } from "./insight-list"
import type { InsightListItem } from "@/types/insights"

interface RecentInsightsClientProps {
  initialInsights: InsightListItem[]
  userId: string
}

export function RecentInsightsClient({ initialInsights, userId }: RecentInsightsClientProps) {
  const [insights, setInsights] = useState<InsightListItem[]>(initialInsights)
  const [isPending, startTransition] = useTransition()

  const fetchRecentInsights = useCallback(async () => {
    const res = await fetch(`/api/insights/recent?_t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
    })

    if (!res.ok) {
      throw new Error("Failed to load recent insights")
    }

    return (await res.json()) as { insights: InsightListItem[] }
  }, [])

  // Sync initialInsights when they change
  useEffect(() => {
    setInsights(initialInsights)
  }, [initialInsights])

  // Listen for insights:invalidate event to refresh
  useEffect(() => {
    const handler = () => {
      startTransition(async () => {
        try {
          const data = await fetchRecentInsights()
          setInsights(data.insights)
        } catch (err) {
          console.error("[v0] Refresh recent insights error:", err)
        }
      })
    }

    window.addEventListener("insights:invalidate", handler)
    return () => window.removeEventListener("insights:invalidate", handler)
  }, [fetchRecentInsights])

  return <InsightList insights={insights} />
}

