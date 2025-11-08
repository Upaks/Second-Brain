import { Prisma } from "@prisma/client"

import { prisma } from "./db"
import { generateEmbedding } from "./ai/embed"

const DEFAULT_SEARCH_LIMIT = Number(process.env.SEARCH_LIMIT ?? "20")
const DEFAULT_RELATED_LIMIT = Number(process.env.RELATED_LIMIT ?? "6")

type InsightRecord = Awaited<ReturnType<typeof fetchInsightsByIds>>[number]

function toVectorLiteral(values: number[]) {
  const sanitized = values.map((value) => (Number.isFinite(value) ? Number(value) : 0))
  return Prisma.raw(`'[${sanitized.join(",")}]'::vector`)
}

function distanceToSimilarity(distance: number | null | undefined) {
  if (typeof distance !== "number" || Number.isNaN(distance)) {
    return null
  }

  const similarity = 1 - distance
  return Math.max(0, Math.min(1, similarity))
}

function normalizeEmbedding(value: unknown): number[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((entry) => Number(entry) || 0)
  }
  if (typeof value === "string") {
    return value
      .replace(/[\[\]{}]/g, "")
      .split(",")
      .map((part) => Number(part.trim()) || 0)
  }
  return []
}

async function vectorSearch(userId: string, embedding: number[], limit: number, excludeId?: string) {
  if (!embedding.length) return [] as Array<{ id: string; similarity: number | null }>

  const vectorSql = toVectorLiteral(embedding)

  const baseQuery = Prisma.sql`
    SELECT "id", (embedding <=> ${vectorSql}) AS distance
    FROM "Insight"
    WHERE "userId" = ${userId}
      AND embedding IS NOT NULL
  `

  const query = excludeId
    ? Prisma.sql`${baseQuery} AND "id" <> ${excludeId} ORDER BY embedding <=> ${vectorSql} LIMIT ${limit}`
    : Prisma.sql`${baseQuery} ORDER BY embedding <=> ${vectorSql} LIMIT ${limit}`

  const rows = await prisma.$queryRaw<Array<{ id: string; distance: number }>>(query)

  return rows.map((row) => ({ id: row.id, similarity: distanceToSimilarity(row.distance) }))
}

async function fetchInsightsByIds(ids: string[]) {
  if (ids.length === 0) return [] as Array<Awaited<ReturnType<typeof prisma.insight.findMany>>[number]>

  const insights = await prisma.insight.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    include: {
      tags: {
        include: { tag: true },
      },
      ingestItem: true,
      reminders: {
        where: {
          sentAt: null,
        },
        orderBy: {
          dueAt: "asc",
        },
        take: 1,
      },
    },
  })

  const map = new Map(insights.map((insight) => [insight.id, insight]))
  return ids.map((id) => map.get(id)).filter(Boolean) as Array<Awaited<ReturnType<typeof prisma.insight.findMany>>[number]>
}

export type SearchResult = InsightRecord & { similarity?: number | null }

export async function searchInsights(userId: string, query: string, limit = DEFAULT_SEARCH_LIMIT): Promise<SearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const [embedding, keywordMatches] = await Promise.all([
    generateEmbedding(trimmed),
    prisma.insight.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: trimmed, mode: "insensitive" } },
          { summary: { contains: trimmed, mode: "insensitive" } },
          { takeaway: { contains: trimmed, mode: "insensitive" } },
          { content: { contains: trimmed, mode: "insensitive" } },
          {
            tags: {
              some: {
                tag: {
                  name: { contains: trimmed, mode: "insensitive" },
                },
              },
            },
          },
        ],
      },
      include: {
        tags: {
          include: { tag: true },
        },
        ingestItem: true,
        reminders: {
          where: {
            sentAt: null,
          },
          orderBy: {
            dueAt: "asc",
          },
          take: 1,
        },
      },
      take: limit,
    }),
  ])

  const vectorMatches = await vectorSearch(userId, embedding, limit)
  const vectorIds = vectorMatches.map((match) => match.id)
  const keywordIds = keywordMatches.map((match) => match.id)
  const combinedIds = [...new Set([...vectorIds, ...keywordIds])].slice(0, limit)

  const combinedInsights = await fetchInsightsByIds(combinedIds)
  const similarityMap = new Map(vectorMatches.map((match) => [match.id, match.similarity]))
  const keywordMap = new Map(keywordMatches.map((match) => [match.id, match]))

  return combinedIds
    .map((id) => {
      const base = combinedInsights.find((item) => item.id === id) ?? keywordMap.get(id)
      if (!base) return null
      const similarity = similarityMap.get(id) ?? null
      return { ...base, similarity }
    })
    .filter(Boolean) as SearchResult[]
}

export async function findRelatedInsights(
  insightId: string,
  userId: string,
  limit = DEFAULT_RELATED_LIMIT,
): Promise<SearchResult[]> {
  const rows = await prisma.$queryRaw<Array<{ embedding: string }>>`
    SELECT embedding::text AS embedding FROM "Insight"
    WHERE "id" = ${insightId} AND "userId" = ${userId}
    LIMIT 1
  `

  const embedding = normalizeEmbedding(rows[0]?.embedding)
  if (!embedding.length) return []

  const vectorMatches = await vectorSearch(userId, embedding, limit + 1, insightId)
  const relatedIds = vectorMatches.map((match) => match.id)

  if (relatedIds.length === 0) return []

  const relatedInsights = await fetchInsightsByIds(relatedIds)
  const similarityMap = new Map(vectorMatches.map((match) => [match.id, match.similarity]))

  return relatedIds
    .map((id) => {
      const base = relatedInsights.find((item) => item.id === id)
      if (!base) return null
      const similarity = similarityMap.get(id) ?? null
      return { ...base, similarity }
    })
    .filter(Boolean) as SearchResult[]
}

