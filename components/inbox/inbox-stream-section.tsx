import { InboxList, type InboxIngestItem } from "./inbox-list"
import { ResetStuckItemsButton } from "./reset-stuck-items-button"
import { prisma } from "@/lib/db"
import type { InsightTag, Tag } from "@prisma/client"

type InboxInsight = {
  id: string
  userId: string
  title: string
  summary: string
  takeaway: string
  content: string | null
  ingestItemId: string | null
  sectionIndex: number | null
  createdAt: Date
  updatedAt: Date
  tags: (InsightTag & { tag: Tag })[]
}

interface InboxStreamSectionProps {
  userId: string
}

export async function InboxStreamSection({ userId }: InboxStreamSectionProps) {
  // Get pending and recently processed items
  const ingestItems = await prisma.ingestItem.findMany({
    where: {
      userId,
      status: {
        in: ["PENDING", "PROCESSING", "DONE"],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const insightMap = new Map<string, InboxInsight[]>()

  if (ingestItems.length > 0) {
    const insightRecords = await prisma.insight.findMany({
      where: {
        ingestItemId: { in: ingestItems.map((item) => item.id) },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    })

    for (const record of insightRecords) {
      if (!record.ingestItemId) continue
      const bucket = insightMap.get(record.ingestItemId) ?? ([] as InboxInsight[])
      const composed: InboxInsight = {
        id: record.id,
        userId: record.userId,
        title: record.title,
        summary: record.summary,
        takeaway: record.takeaway,
        content: record.content,
        ingestItemId: record.ingestItemId,
        sectionIndex: "sectionIndex" in record && typeof (record as any).sectionIndex === "number"
          ? ((record as any).sectionIndex as number)
          : null,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        tags: record.tags as (InsightTag & { tag: Tag })[],
      }
      bucket.push(composed)
      bucket.sort((a, b) => {
        const aIndex =
          typeof (a as { sectionIndex?: number }).sectionIndex === "number"
            ? ((a as { sectionIndex?: number }).sectionIndex as number)
            : Number.MAX_SAFE_INTEGER
        const bIndex =
          typeof (b as { sectionIndex?: number }).sectionIndex === "number"
            ? ((b as { sectionIndex?: number }).sectionIndex as number)
            : Number.MAX_SAFE_INTEGER
        return aIndex - bIndex
      })
      insightMap.set(record.ingestItemId, bucket)
    }
  }

  const itemsWithInsights: InboxIngestItem[] = ingestItems.map((item) => {
    const insights = insightMap.get(item.id) ?? ([] as InboxInsight[])
    return {
      ...item,
      insights,
    } as InboxIngestItem
  })

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3 text-white">Inbox</h1>
          <p className="text-white/70 text-lg">Recent captures and processing status</p>
        </div>
        <ResetStuckItemsButton />
      </div>

      <InboxList items={itemsWithInsights} />
    </div>
  )
}

