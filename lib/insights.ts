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

  if (normalized.length === 0) {
    return
  }

  await prisma.$transaction(async (tx) => {
    await tx.insightTag.deleteMany({ where: { insightId } })

    for (const name of normalized) {
      const tag = await tx.tag.upsert({
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
      })

      await tx.insightTag.create({
        data: {
          insightId,
          tagId: tag.id,
        },
      })
    }
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
