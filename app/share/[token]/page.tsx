import { notFound } from "next/navigation"

import { verifyShareToken } from "@/lib/flashcards-share"
import { getDeckById } from "@/lib/flashcards-server"
import { ShareDeckClient } from "@/components/flashcards/share-deck-client"

interface SharePageProps {
  params: { token: string }
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = params
  const payload = verifyShareToken(token)
  if (!payload) {
    notFound()
  }

  const deck = await getDeckById(payload.userId, payload.deckId)
  if (!deck) {
    notFound()
  }

  return <ShareDeckClient deck={deck} />
}
