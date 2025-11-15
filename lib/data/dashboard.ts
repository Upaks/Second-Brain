import { cache } from "react"

import { prisma } from "@/lib/db"

const INSIGHTS_GRID_PAGE_SIZE = 50

const RECENT_INSIGHTS_LIMIT = 9

export const getRecentInsights = cache(async (userId: string) => {
  const insights = await prisma.insight.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      takeaway: true,
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
    },
    orderBy: { createdAt: "desc" },
    take: RECENT_INSIGHTS_LIMIT,
  })

  return insights.map((insight) => ({
    ...insight,
    reminders: insight.reminders ?? [],
  }))
})

export const getInsightsGrid = cache(
  async (userId: string, tag?: string) => {
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
      select: {
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
      },
      orderBy: { createdAt: "desc" },
      take: INSIGHTS_GRID_PAGE_SIZE,
    })

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
  },
)

export const getAvailableTags = cache(async (userId: string) => {
  return prisma.tag.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
})

export const getCollectionsOverview = cache(async (userId: string) => {
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
})

