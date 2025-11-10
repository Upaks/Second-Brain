import { prisma } from "@/lib/db"
import { buildFlashcardsFromInsight, type InsightForFlashcard, type Flashcard } from "./flashcards"

export interface FlashcardDeckData {
  id: string
  name: string
  description?: string
  flashcards: Flashcard[]
}

function slugifyTag(tag: string) {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "topic"
}

function cloneCards(cards: Flashcard[]): Flashcard[] {
  return cards.map((card) => ({
    ...card,
    tags: [...card.tags],
    keyPoints: [...card.keyPoints],
    followUpPrompts: [...card.followUpPrompts],
    source: card.source ? { ...card.source } : undefined,
  }))
}

export async function getFlashcardDecksForUser(userId: string): Promise<FlashcardDeckData[]> {
  const [insights, collections] = await Promise.all([
    prisma.insight.findMany({
      where: { userId },
      include: {
        tags: {
          include: { tag: true },
        },
        ingestItem: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.collection.findMany({
      where: { userId },
      include: {
        insights: {
          include: {
            insight: {
              include: {
                tags: {
                  include: { tag: true },
                },
                ingestItem: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const insightsForFlashcards = insights as InsightForFlashcard[]
  const cardsByInsight = new Map<string, Flashcard[]>()
  const allFlashcards: Flashcard[] = []

  insightsForFlashcards.forEach((insight) => {
    const cards = buildFlashcardsFromInsight(insight)
    cardsByInsight.set(insight.id, cards)
    allFlashcards.push(...cards)
  })

  const allDeck: FlashcardDeckData = {
    id: "all",
    name: "All Insights",
    description: `${allFlashcards.length} card${allFlashcards.length === 1 ? "" : "s"} from your latest captures`,
    flashcards: cloneCards(allFlashcards),
  }

  const topicDeckMap = new Map<
    string,
    {
      tag: string
      cardSet: Map<string, Flashcard>
    }
  >()

  allFlashcards.forEach((card) => {
    const tagNames = card.tags.filter((tag) => !tag.startsWith("card:"))
    const primaryTags = tagNames.length > 0 ? tagNames : ["General"]
    primaryTags.forEach((tag) => {
      const slug = slugifyTag(tag)
      const existing = topicDeckMap.get(slug) ?? { tag, cardSet: new Map<string, Flashcard>() }
      if (!existing.cardSet.has(card.id)) {
        existing.cardSet.set(card.id, card)
      }
      topicDeckMap.set(slug, existing)
    })
  })

  const topicDecks: FlashcardDeckData[] = Array.from(topicDeckMap.entries())
    .map(([slug, value]) => {
      const cards = Array.from(value.cardSet.values())
      return {
        id: `topic-${slug}`,
        name: value.tag,
        description: `${cards.length} card${cards.length === 1 ? "" : "s"} related to ${value.tag}`,
        flashcards: cloneCards(cards),
      }
    })
    .filter((deck) => deck.flashcards.length > 0)
    .sort((a, b) => b.flashcards.length - a.flashcards.length || a.name.localeCompare(b.name))

  const collectionDecks: FlashcardDeckData[] = collections.map((collection) => {
    const collectionInsights = collection.insights.map((i) => i.insight?.id).filter(Boolean) as string[]
    const cards = collectionInsights.flatMap((insightId) => cardsByInsight.get(insightId) ?? [])

    return {
      id: collection.id,
      name: collection.name,
      description: `${cards.length} card${cards.length === 1 ? "" : "s"} from ${collection.name}`,
      flashcards: cloneCards(cards),
    }
  }).filter((deck) => deck.flashcards.length > 0)

  return [allDeck, ...topicDecks, ...collectionDecks].filter((deck) => deck.flashcards.length > 0)
}

export async function getDeckById(userId: string, deckId: string): Promise<FlashcardDeckData | null> {
  const decks = await getFlashcardDecksForUser(userId)
  return decks.find((deck) => deck.id === deckId) ?? null
}

