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

function escapeCsvField(value: string) {
  return JSON.stringify(value ?? "")
}

function flattenKeyPoints(card: Flashcard) {
  return card.keyPoints.join(" ;; ")
}

function flattenPrompts(card: Flashcard) {
  return card.followUpPrompts.join(" ;; ")
}

function flattenTags(card: Flashcard) {
  return card.tags.join(" ;; ")
}

function flattenSourceUrl(card: Flashcard) {
  return card.source?.url ?? ""
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
    escapeCsvField(card.title ?? ""),
    escapeCsvField(card.question ?? ""),
    escapeCsvField(card.answer ?? ""),
    escapeCsvField(flattenKeyPoints(card)),
    escapeCsvField(flattenPrompts(card)),
    escapeCsvField(card.difficulty ?? ""),
    escapeCsvField(flattenTags(card)),
    escapeCsvField(flattenSourceUrl(card)),
  ])
  return [header.map((h) => JSON.stringify(h)).join(","), ...rows.map((row) => row.join(","))].join("\n")
}

function escapeForDelimited(value: string | null | undefined) {
  return (value ?? "")
    .replace(/\r?\n/g, " <br> ")
    .replace(/\t/g, "    ")
    .trim()
}

function buildBackContent(card: Flashcard) {
  const parts: string[] = []
  if (card.answer) parts.push(card.answer)
  if (card.keyPoints.length) parts.push(`Key points: ${card.keyPoints.join(" · ")}`)
  if (card.followUpPrompts.length) parts.push(`Reflect: ${card.followUpPrompts.join(" · ")}`)
  return parts.join("<br><br>")
}

export function flashcardsToAnkiTsv(flashcards: Flashcard[]): string {
  const lines = flashcards.map((card) => {
    const front = escapeForDelimited(card.question)
    const back = escapeForDelimited(buildBackContent(card))
    const tags = card.tags.map((tag) => tag.replace(/\s+/g, "_")).join(" ")
    return `${front}\t${back}\t${tags}`
  })
  return lines.join("\n")
}

export function flashcardsToQuizletText(flashcards: Flashcard[]): string {
  return flashcards
    .map((card) => {
      const front = escapeForDelimited(card.question)
      const back = escapeForDelimited(buildBackContent(card))
      return `${front}\t${back}`
    })
    .join("\n")
}

export function flashcardsToNotionCsv(flashcards: Flashcard[]): string {
  const header = [
    "Title",
    "Answer",
    "Key Points",
    "Reflection Prompts",
    "Difficulty",
    "Tags",
    "Source URL",
    "Created",
  ]

  const rows = flashcards.map((card) => [
    escapeCsvField(card.question ?? card.title ?? ""),
    escapeCsvField(card.answer ?? ""),
    escapeCsvField(flattenKeyPoints(card)),
    escapeCsvField(flattenPrompts(card)),
    escapeCsvField(card.difficulty ?? ""),
    escapeCsvField(card.tags.join(", ")),
    escapeCsvField(flattenSourceUrl(card)),
    escapeCsvField(card.createdAt ?? ""),
  ])

  return [header.map((h) => JSON.stringify(h)).join(","), ...rows.map((row) => row.join(","))].join("\n")
}

