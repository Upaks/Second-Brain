import { notFound } from "next/navigation"

import { verifyShareToken } from "@/lib/flashcards-share"
import { getDeckById } from "@/lib/flashcards-server"
import { ShareDeckClient } from "@/components/flashcards/share-deck-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface SharePageProps {
  params: Promise<{ token?: string[] }>
}

export default async function SharePage({ params }: SharePageProps) {
  const resolvedParams = await params
  const token = Array.isArray(resolvedParams.token)
    ? resolvedParams.token.join("/")
    : resolvedParams.token ?? ""

  const payload = verifyShareToken(token)
  if (!payload) {
    notFound()
  }

  const deck = await getDeckById(payload.userId, payload.deckId)
  if (!deck) {
    notFound()
  }

  const cardIds = Array.isArray(payload.cardIds) ? payload.cardIds : []
  const shareDeck =
    cardIds.length > 0
      ? {
          ...deck,
          flashcards: cardIds
            .map((id) => deck.flashcards.find((card) => card.id === id))
            .filter((card): card is (typeof deck.flashcards)[number] => Boolean(card)),
        }
      : deck

  if (shareDeck.flashcards.length === 0) {
    notFound()
  }

  return <ShareDeckClient deck={shareDeck} />
}
