import { Prisma } from "@prisma/client"
import { unstable_cache } from "next/cache"

import { prisma } from "@/lib/db"
import { cacheTags } from "@/lib/cache/tags"
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

const flashcardInsightSelect = Prisma.validator<Prisma.InsightSelect>()({
  id: true,
  title: true,
  summary: true,
  takeaway: true,
  content: true,
  createdAt: true,
  tags: {
    select: {
      tag: {
        select: {
          name: true,
        },
      },
    },
  },
  ingestItem: {
    select: {
      type: true,
      meta: true,
      mime: true,
    },
  },
})

const flashcardCollectionSelect = Prisma.validator<Prisma.CollectionSelect>()({
  id: true,
  name: true,
  description: true,
  insights: {
    select: {
      insightId: true,
    },
  },
})

async function buildFlashcardDecks(userId: string) {
  console.log(`[flashcards] buildFlashcardDecks called for user ${userId}`)
  
  let insights: any[] = []
  let collections: any[] = []
  
  try {
    const results = await Promise.all([
      prisma.insight.findMany({
        where: { userId },
        select: flashcardInsightSelect,
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.collection.findMany({
        where: { userId },
        select: flashcardCollectionSelect,
        orderBy: { createdAt: "desc" },
      }),
    ])
    insights = results[0]
    collections = results[1]
  } catch (error) {
    console.error(`[flashcards] Error fetching insights/collections for user ${userId}:`, error)
    // Return empty deck on error
    return [{
      id: "all",
      name: "All Insights",
      description: "Error loading insights. Please refresh the page.",
      flashcards: [],
    }]
  }

  // Debug logging
  console.log(`[flashcards] Found ${insights.length} insights for user ${userId}`)
  if (insights.length > 0) {
    console.log(`[flashcards] Sample insight:`, {
      id: insights[0].id,
      title: insights[0].title,
      hasSummary: !!insights[0].summary,
      hasTakeaway: !!insights[0].takeaway,
      tagsCount: insights[0].tags.length,
    })
  }

  // Transform insights to match InsightForFlashcard type structure
  // The Prisma select gives us the right data, we just need to ensure the tags structure matches
  const insightsForFlashcards: InsightForFlashcard[] = insights.map((insight) => ({
    id: insight.id,
    userId: "", // Not used in flashcard generation
    title: insight.title,
    summary: insight.summary,
    takeaway: insight.takeaway,
    content: insight.content,
    createdAt: insight.createdAt,
    updatedAt: insight.createdAt, // Use createdAt as fallback
    ingestItemId: null, // Not used in flashcard generation
    sectionIndex: null, // Not used in flashcard generation
    sectionLabel: null, // Not used in flashcard generation
    tags: insight.tags.map((it: any) => ({
      insightId: insight.id,
      tagId: "", // Not needed for flashcard generation
      tag: {
        id: "",
        name: it.tag.name,
        userId: "",
        color: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })),
    ingestItem: insight.ingestItem || null,
  } as InsightForFlashcard))

  const cardsByInsight = new Map<string, Flashcard[]>()
  const allFlashcards: Flashcard[] = []

  console.log(`[flashcards] Processing ${insightsForFlashcards.length} insights for flashcard generation`)

  insightsForFlashcards.forEach((insight) => {
    let cards: Flashcard[] = []
    try {
      cards = buildFlashcardsFromInsight(insight)
      console.log(`[flashcards] Generated ${cards.length} cards for insight "${insight.title}" (${insight.id})`)
    } catch (error) {
      console.error(`[flashcards] Error in buildFlashcardsFromInsight for insight ${insight.id}:`, error)
      // Will create fallback below
    }

    if (cards.length > 0) {
      cardsByInsight.set(insight.id, cards)
      allFlashcards.push(...cards)
    } else {
      // Fallback: ensure at least one card is generated per insight
      console.warn(`[flashcards] No cards generated for insight ${insight.id} ("${insight.title}"), creating fallback`)
      try {
        const fallbackCard: Flashcard = {
          id: `${insight.id}#fallback`,
          insightId: insight.id,
          insightTitle: insight.title || "Untitled insight",
          createdAt: typeof insight.createdAt === 'string' ? insight.createdAt : insight.createdAt.toISOString(),
          cardType: "core",
          title: insight.title || "Untitled insight",
          question: `What should you remember about "${insight.title || "this insight"}"?`,
          answer: insight.takeaway || insight.summary || "Review the original insight.",
          keyPoints: insight.summary
            ? insight.summary
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .slice(0, 3)
            : [],
          followUpPrompts: ["Explain this insight to someone else.", "Where could you apply it next?"],
          difficulty: "foundation",
          tags: [
            ...new Set([
              ...insight.tags.map((t) => t.tag?.name).filter(Boolean),
              "card:core",
            ]),
          ],
          source: insight.ingestItem
            ? {
                type: insight.ingestItem.type,
                url:
                  typeof insight.ingestItem.meta === "object" && insight.ingestItem.meta
                    ? (insight.ingestItem.meta as any).url ?? null
                    : null,
                title:
                  typeof insight.ingestItem.meta === "object" && insight.ingestItem.meta
                    ? (insight.ingestItem.meta as any).title ?? null
                    : null,
                mime: insight.ingestItem.mime,
              }
            : undefined,
          reviewCount: 0,
          lastReviewAt: null,
          difficultyScore: 0,
        }
        cardsByInsight.set(insight.id, [fallbackCard])
        allFlashcards.push(fallbackCard)
      } catch (fallbackError) {
        console.error(`[flashcards] Error creating fallback card for insight ${insight.id}:`, fallbackError)
        // Last resort: create minimal error card
        const errorCard: Flashcard = {
          id: `${insight.id}#error`,
          insightId: insight.id,
          insightTitle: insight.title || "Untitled insight",
          createdAt: new Date().toISOString(),
          cardType: "core",
          title: insight.title || "Untitled insight",
          question: `What is "${insight.title || "this insight"}" about?`,
          answer: "Review the original insight.",
          keyPoints: [],
          followUpPrompts: ["Review the original insight for more details."],
          difficulty: "foundation",
          tags: ["card:core"],
          reviewCount: 0,
          lastReviewAt: null,
          difficultyScore: 0,
        }
        cardsByInsight.set(insight.id, [errorCard])
        allFlashcards.push(errorCard)
      }
    }
  })

  console.log(`[flashcards] Total flashcards generated: ${allFlashcards.length} from ${insights.length} insights`)

  // Always include the "all" deck, even if empty, so users can see the state
  const allDeck: FlashcardDeckData = {
    id: "all",
    name: "All Insights",
    description:
      allFlashcards.length > 0
        ? `${allFlashcards.length} card${allFlashcards.length === 1 ? "" : "s"} from your latest captures`
        : insights.length > 0
          ? `No flashcards generated from ${insights.length} insight${insights.length === 1 ? "" : "s"} yet`
          : "No insights available to generate flashcards from",
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
    const collectionInsights = collection.insights.map((i: any) => i.insightId).filter(Boolean)
    const cards = collectionInsights.flatMap((insightId: string) => cardsByInsight.get(insightId) ?? [])

    return {
      id: collection.id,
      name: collection.name,
      description: `${cards.length} card${cards.length === 1 ? "" : "s"} from ${collection.name}`,
      flashcards: cloneCards(cards),
    }
  }).filter((deck) => deck.flashcards.length > 0)

  // Always include the "all" deck first, then filter others
  const result = [allDeck, ...topicDecks, ...collectionDecks]
  // Only filter out topic/collection decks if empty, but always keep "all" deck
  const filtered = result.filter((deck) => deck.id === "all" || deck.flashcards.length > 0)
  
  console.log(`[flashcards] Returning ${filtered.length} decks (${allFlashcards.length} total cards)`)
  
  // CRITICAL: Always return at least the "all" deck, even if empty
  if (filtered.length === 0 || !filtered.some(d => d.id === "all")) {
    console.warn(`[flashcards] No decks found, returning empty "all" deck`)
    return [allDeck]
  }
  
  return filtered
}

export async function getFlashcardDecksForUser(userId: string): Promise<FlashcardDeckData[]> {
  console.log(`[flashcards] getFlashcardDecksForUser called for user ${userId}`)
  
  const result = await unstable_cache(
    async () => {
      console.log(`[flashcards] Cache miss - calling buildFlashcardDecks for user ${userId}`)
      return await buildFlashcardDecks(userId)
    },
    ["flashcard-decks", userId],
    { 
      tags: [cacheTags.flashcards(userId)],
    },
  )()
  
  console.log(`[flashcards] getFlashcardDecksForUser returning ${result.length} decks`)
  return result
}

export async function getDeckById(userId: string, deckId: string): Promise<FlashcardDeckData | null> {
  const decks = await getFlashcardDecksForUser(userId)
  return decks.find((deck) => deck.id === deckId) ?? null
}

