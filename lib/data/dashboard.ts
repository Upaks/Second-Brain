import { unstable_cache } from "next/cache"

import { prisma } from "@/lib/db"
import { cacheTags } from "@/lib/cache/tags"
import type { InsightGridItem, InsightListItem, AvailableTag } from "@/types/insights"
import type { Prisma } from "@prisma/client"

const INSIGHTS_GRID_PAGE_SIZE = 30
const RECENT_INSIGHTS_LIMIT = 9
const insightOrderBy = { createdAt: "desc" } as const

const insightSelect = {
  id: true,
  title: true,
  takeaway: true,
  summary: true,
  createdAt: true,
  tags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  reminders: {
    select: {
      id: true,
      dueAt: true,
    },
    where: {
      sentAt: null,
    },
    orderBy: {
      dueAt: "asc",
    },
    take: 1,
  },
  _count: {
    select: {
      linksTo: true,
    },
  },
} as const

type InsightRecord = Prisma.InsightGetPayload<{ select: typeof insightSelect }>

type InsightGridResponse = {
  items: InsightGridItem[]
  nextCursor: string | null
}

function mapInsights(insights: InsightRecord[]) {
  return insights.map(({ summary, _count, reminders, ...rest }) => ({
    ...rest,
    reminders: reminders ?? [],
    summaryPreview: summary
      ? summary
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [],
    linkCount: _count.linksTo,
  }))
}

async function fetchInsights(userId: string, tag?: string, cursor?: string, limit = INSIGHTS_GRID_PAGE_SIZE) {
  const where: Record<string, unknown> = { userId }

  if (tag) {
    where.tags = {
      some: {
        tag: {
          name: tag,
        },
      },
    }
  }

  const insights = await prisma.insight.findMany({
    where,
    select: insightSelect,
    orderBy: insightOrderBy,
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
  })

  const hasMore = insights.length > limit
  const items = mapInsights(insights.slice(0, limit))

  return {
    items,
    nextCursor: hasMore ? insights[limit]?.id ?? null : null,
  }
}

export async function getRecentInsights(userId: string): Promise<InsightListItem[]> {
  return unstable_cache(
    async () => {
      const insights = await prisma.insight.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          takeaway: true,
          createdAt: true,
          tags: insightSelect.tags,
          reminders: insightSelect.reminders,
        },
        orderBy: insightOrderBy,
        take: RECENT_INSIGHTS_LIMIT,
      })

      return insights.map((insight) => ({
        ...insight,
        reminders: insight.reminders ?? [],
      }))
    },
    ["dashboard-recent", userId],
    { tags: [cacheTags.dashboardRecent(userId), cacheTags.insights(userId)] },
  )()
}

export async function getInsightsGrid(
  userId: string,
  options?: { tag?: string; cursor?: string; limit?: number },
): Promise<InsightGridResponse> {
  const { tag, cursor, limit } = {
    limit: INSIGHTS_GRID_PAGE_SIZE,
    ...options,
  }

  if (cursor) {
    return fetchInsights(userId, tag, cursor, limit)
  }

  const tags = new Set<string>([cacheTags.insights(userId)])
  if (tag) {
    tags.add(cacheTags.insightFilter(userId, tag))
  }

  return unstable_cache(
    () => fetchInsights(userId, tag, undefined, limit),
    ["insights-grid", userId, tag ?? "all", `${limit}`],
    { tags: Array.from(tags) },
  )()
}

export async function getAvailableTags(userId: string): Promise<AvailableTag[]> {
  return unstable_cache(
    () =>
      prisma.tag.findMany({
        where: { userId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ["insight-tags", userId],
    { tags: [cacheTags.dashboardTags(userId)] },
  )()
}

export async function getCollectionsOverview(userId: string) {
  return unstable_cache(
    async () => {
      const collections = await prisma.collection.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          updatedAt: true,
          _count: {
            select: {
              insights: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      })

      return collections.map(({ _count, ...collection }) => ({
        ...collection,
        insightCount: _count.insights,
      }))
    },
    ["collections-overview", userId],
    { tags: [cacheTags.dashboardCollections(userId)] },
  )()
}




