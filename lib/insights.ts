import { Prisma } from "@prisma/client"

import { prisma } from "./db"

export async function upsertTagsForInsight(userId: string, insightId: string, tags: string[] = []) {
  const normalized = Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 1 && tag.length <= 40),
    ),
  )

  await prisma.insightTag.deleteMany({ where: { insightId } })

  if (normalized.length === 0) {
    return
  }

  const tagRecords = await Promise.all(
    normalized.map((name) =>
      prisma.tag.upsert({
        where: {
          userId_name: {
            userId,
            name,
          },
        },
        create: {
          userId,
          name,
        },
        update: {},
      }),
    ),
  )

  await prisma.insightTag.createMany({
    data: tagRecords.map((tag) => ({
      insightId,
      tagId: tag.id,
    })),
    skipDuplicates: true,
  })
}

export async function setInsightEmbedding(insightId: string, embedding: number[]) {
  if (!embedding.length) return

  const vectorLiteral = `[${embedding.join(",")}]`

  await prisma.$executeRaw`
    UPDATE "Insight"
    SET "embedding" = ${vectorLiteral}::vector
    WHERE "id" = ${insightId}
  `
}
