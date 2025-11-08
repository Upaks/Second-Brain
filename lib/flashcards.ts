import type { Insight, InsightTag, Tag, IngestItem } from "@prisma/client"

export type FlashcardDifficulty = "foundation" | "intermediate" | "challenge"

export interface Flashcard {
  id: string
  insightId: string
  createdAt: string
  title: string
  question: string
  answer: string
  keyPoints: string[]
  followUpPrompts: string[]
  difficulty: FlashcardDifficulty
  tags: string[]
  source?: {
    type?: string | null
    url?: string | null
    title?: string | null
    mime?: string | null
  }
  lastReviewAt?: string | null
  reviewCount?: number
  difficultyScore?: number
}

export type InsightForFlashcard = Insight & {
  tags: (InsightTag & {
    tag: Tag
  })[]
  ingestItem?: IngestItem | null
}

function normaliseSummary(summary?: string | null) {
  if (!summary) return []
  return summary
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

function chooseDifficulty(summaryLines: string[], content?: string | null): FlashcardDifficulty {
  const lengthScore = content ? Math.min(content.length / 600, 2) : 0
  const bulletScore = summaryLines.length
  const score = lengthScore + bulletScore

  if (score <= 3) return "foundation"
  if (score <= 6) return "intermediate"
  return "challenge"
}

function buildQuestion(title: string, summaryLines: string[], takeaway: string) {
  if (takeaway) {
    return `What is the key takeaway from “${title}”?`
  }
  if (summaryLines[0]) {
    return `Summarise the main idea of “${title}”.`
  }
  return `What did you learn from “${title}”?`
}

function buildAnswer(takeaway: string, summaryLines: string[]) {
  if (takeaway) return takeaway
  if (summaryLines.length) return summaryLines.join(" ")
  return "Review the original insight."
}

function buildFollowUps(summaryLines: string[], content?: string | null) {
  const prompts: string[] = []

  summaryLines.slice(0, 3).forEach((line) => {
    if (!line) return
    const cleaned = line.replace(/^\W+/, "")
    prompts.push(`Explain: ${cleaned}`)
  })

  if (content && content.length > 800) {
    prompts.push("Create a real-world example that illustrates this insight.")
  }

  return prompts.slice(0, 4)
}

export function buildFlashcardFromInsight(insight: InsightForFlashcard): Flashcard {
  const summaryLines = normaliseSummary(insight.summary)
  const title = insight.title || "Untitled insight"
  const takeaway = insight.takeaway ?? ""

  const tags = insight.tags.map((t) => t.tag?.name).filter(Boolean)
  const question = buildQuestion(title, summaryLines, takeaway)
  const answer = buildAnswer(takeaway, summaryLines)
  const followUpPrompts = buildFollowUps(summaryLines.slice(1), insight.content)
  const difficulty = chooseDifficulty(summaryLines, insight.content)

  const source =
    insight.ingestItem != null
      ? {
          type: insight.ingestItem.type,
          url:
            typeof insight.ingestItem.meta === "object" && insight.ingestItem?.meta
              ? (insight.ingestItem.meta as any).url ?? null
              : null,
          title:
            typeof insight.ingestItem.meta === "object" && insight.ingestItem?.meta
              ? (insight.ingestItem.meta as any).title ?? null
              : null,
          mime: insight.ingestItem.mime,
        }
      : undefined

  return {
    id: `flashcard-${insight.id}`,
    insightId: insight.id,
    createdAt: insight.createdAt.toISOString(),
    title,
    question,
    answer,
    keyPoints: summaryLines,
    followUpPrompts,
    difficulty,
    tags,
    source,
    reviewCount: 0,
    lastReviewAt: null,
    difficultyScore: 0,
  }
}

export function buildFlashcardsFromInsights(insights: InsightForFlashcard[]): Flashcard[] {
  return insights.map((insight) => buildFlashcardFromInsight(insight))
}

export function flashcardsToCsv(flashcards: Flashcard[]): string {
  const header = [
    "title",
    "question",
    "answer",
    "key_points",
    "follow_up_prompts",
    "difficulty",
    "tags",
    "source_url",
  ]
  const rows = flashcards.map((card) => [
    JSON.stringify(card.title ?? ""),
    JSON.stringify(card.question ?? ""),
    JSON.stringify(card.answer ?? ""),
    JSON.stringify(card.keyPoints.join(" ;; ")),
    JSON.stringify(card.followUpPrompts.join(" ;; ")),
    JSON.stringify(card.difficulty),
    JSON.stringify(card.tags.join(" ;; ")),
    JSON.stringify(card.source?.url ?? ""),
  ])
  return [header.map((h) => JSON.stringify(h)).join(","), ...rows.map((row) => row.join(","))].join("\n")
}

