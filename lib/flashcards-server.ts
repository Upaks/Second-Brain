import { prisma } from "@/lib/db"
import { buildFlashcardsFromInsights, type InsightForFlashcard, type Flashcard } from "./flashcards"

export interface FlashcardDeckData {
  id: string
  name: string
  description?: string
  flashcards: Flashcard[]
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

  const allDeck: FlashcardDeckData = {
    id: "all",
    name: "All Insights",
    description: "Auto-generated from your latest captures",
    flashcards: buildFlashcardsFromInsights(insights as InsightForFlashcard[]),
  }

  const collectionDecks: FlashcardDeckData[] = collections.map((collection) => {
    const collectionInsights = collection.insights
      .map((i) => i.insight)
      .filter(Boolean) as InsightForFlashcard[]

    return {
      id: collection.id,
      name: collection.name,
      description: `${collectionInsights.length} item${collectionInsights.length === 1 ? "" : "s"}`,
      flashcards: buildFlashcardsFromInsights(collectionInsights),
    }
  })

  return [allDeck, ...collectionDecks].filter((deck) => deck.flashcards.length > 0)
}

export async function getDeckById(userId: string, deckId: string): Promise<FlashcardDeckData | null> {
  const decks = await getFlashcardDecksForUser(userId)
  return decks.find((deck) => deck.id === deckId) ?? null
}

