import type { Insight, InsightTag, Tag, IngestItem } from "@prisma/client"

export type FlashcardDifficulty = "foundation" | "intermediate" | "challenge"

export type FlashcardCardType = "core" | "detail" | "tag"

export interface Flashcard {
  id: string
  insightId: string
  insightTitle: string
  createdAt: string
  cardType: FlashcardCardType
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
  ingestItem?: Pick<IngestItem, "type" | "meta" | "mime"> | null
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

function sanitizeListItem(line: string) {
  return line.replace(/^[\s•\-\d\)\(\.]+/, "").trim()
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

  if (prompts.length < 3) {
    prompts.push("Where have you applied this insight recently?")
  }

  return prompts.slice(0, 4)
}

function cardSource(insight: InsightForFlashcard) {
  if (!insight.ingestItem) return undefined
  return {
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
}

function buildCoreFlashcard(insight: InsightForFlashcard, summaryLines: string[]): Flashcard {
  const title = insight.title || "Untitled insight"
  const takeaway = insight.takeaway ?? ""
  const question = takeaway
    ? `What is the key takeaway from “${title}”?`
    : summaryLines[0]
      ? `Summarise the main idea from “${title}”.`
      : `What did you learn from “${title}”?`
  const answer = buildAnswer(takeaway, summaryLines)
  const followUpPrompts = buildFollowUps(summaryLines.slice(1), insight.content)
  const difficulty = chooseDifficulty(summaryLines, insight.content)
  const tags = insight.tags.map((t) => t.tag?.name).filter(Boolean)

  return {
    id: `${insight.id}#core`,
    insightId: insight.id,
    insightTitle: title,
    createdAt: insight.createdAt.toISOString(),
    cardType: "core",
    title,
    question,
    answer,
    keyPoints: summaryLines.slice(0, 4),
    followUpPrompts,
    difficulty,
    tags: [...new Set([...tags, "card:core"])],
    source: cardSource(insight),
    reviewCount: 0,
    lastReviewAt: null,
    difficultyScore: 0,
  }
}

function buildDetailQuestion(title: string, originalBullet: string, index: number) {
  const trimmed = sanitizeListItem(originalBullet)
  if (!trimmed) {
    return `What is another detail you should remember about “${title}”?`
  }

  if (/^(what|why|how|when|where|who|which)\b/i.test(trimmed)) {
    return trimmed.endsWith("?") ? trimmed : `${trimmed}?`
  }

  if (trimmed.includes(":")) {
    const [topic] = trimmed.split(":", 1)
    return `What does “${title}” explain about ${topic.trim()}?`
  }

  if (trimmed.length < 80) {
    return `Why is “${trimmed}” important when considering “${title}”?`
  }

  return `What is one key detail from “${title}” (detail ${index + 1})?`
}

function buildDetailCards(insight: InsightForFlashcard, summaryLines: string[], maxCards = 3): Flashcard[] {
  const title = insight.title || "Untitled insight"
  const difficulty = chooseDifficulty(summaryLines, insight.content)
  const insightTags = insight.tags.map((t) => t.tag?.name).filter(Boolean)
  const trimmedLines = summaryLines.map(sanitizeListItem).filter(Boolean)
  const detailLines = trimmedLines.filter((line) => line.length > 0).slice(0, maxCards)

  return detailLines.map((line, index) => ({
    id: `${insight.id}#detail-${index}`,
    insightId: insight.id,
    insightTitle: title,
    createdAt: insight.createdAt.toISOString(),
    cardType: "detail",
    title,
    question: buildDetailQuestion(title, line, index),
    answer: line,
    keyPoints: [line],
    followUpPrompts: ["How could you explain this detail in your own words?", "Where could this detail be applied?"],
    difficulty,
    tags: [...new Set([...insightTags, "card:detail"])],
    source: cardSource(insight),
    reviewCount: 0,
    lastReviewAt: null,
    difficultyScore: 0,
  }))
}

function buildTagCards(insight: InsightForFlashcard, summaryLines: string[], maxTags = 2): Flashcard[] {
  const title = insight.title || "Untitled insight"
  const insightTags = insight.tags.map((t) => t.tag?.name).filter(Boolean)
  if (insightTags.length === 0) return []

  const trimmedSummary = summaryLines.map(sanitizeListItem).filter(Boolean).join(" ")
  const baseAnswer = insight.takeaway || trimmedSummary || "Review full insight for details."
  const difficulty = chooseDifficulty(summaryLines, insight.content)

  return insightTags.slice(0, maxTags).map((tagName, index) => ({
    id: `${insight.id}#tag-${index}`,
    insightId: insight.id,
    insightTitle: title,
    createdAt: insight.createdAt.toISOString(),
    cardType: "tag",
    title,
    question: `How does “${title}” relate to ${tagName}?`,
    answer: baseAnswer,
    keyPoints: summaryLines.slice(0, 3),
    followUpPrompts: [`Where else does ${tagName} appear in your knowledge base?`],
    difficulty,
    tags: [...new Set([...insightTags, "card:tag"])],
    source: cardSource(insight),
    reviewCount: 0,
    lastReviewAt: null,
    difficultyScore: 0,
  }))
}

export function buildFlashcardsFromInsight(insight: InsightForFlashcard): Flashcard[] {
  const summaryLines = normaliseSummary(insight.summary)
  const seen = new Set<string>()
  const cards: Flashcard[] = []

  function addCard(card: Flashcard) {
    const key = `${card.question}::${card.answer}`
    if (seen.has(key)) return
    seen.add(key)
    cards.push(card)
  }

  addCard(buildCoreFlashcard(insight, summaryLines))
  buildDetailCards(insight, summaryLines).forEach(addCard)
  buildTagCards(insight, summaryLines).forEach(addCard)

  if (cards.length === 0) {
    addCard({
      id: `${insight.id}#fallback`,
      insightId: insight.id,
      insightTitle: insight.title ?? "Untitled insight",
      createdAt: insight.createdAt.toISOString(),
      cardType: "core",
      title: insight.title ?? "Untitled insight",
      question: `What should you remember about “${insight.title ?? "this insight"}”?`,
      answer: insight.takeaway ?? insight.summary ?? "Review the original insight.",
      keyPoints: summaryLines.slice(0, 3),
      followUpPrompts: ["Explain this insight to someone else.", "Where could you apply it next?"],
      difficulty: "foundation",
      tags: [
        ...new Set([
          ...insight.tags.map((t) => t.tag?.name).filter(Boolean),
          "card:core",
        ]),
      ],
      source: cardSource(insight),
      reviewCount: 0,
      lastReviewAt: null,
      difficultyScore: 0,
    })
  }

  return cards
}

export function buildFlashcardsFromInsights(insights: InsightForFlashcard[]): Flashcard[] {
  const cards: Flashcard[] = []
  insights.forEach((insight) => {
    cards.push(...buildFlashcardsFromInsight(insight))
  })
  return cards
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

