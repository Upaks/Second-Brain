import { FlashcardWorkspaceClient } from "./flashcard-workspace-client"
import type { FlashcardDeck } from "./flashcard-workspace"
import { getFlashcardDecksForUser } from "@/lib/flashcards-server"

interface FlashcardsStreamSectionProps {
  userId: string
}

export async function FlashcardsStreamSection({ userId }: FlashcardsStreamSectionProps) {
  const rawDecks = await getFlashcardDecksForUser(userId)
  console.log(`[flashcards-stream] Received ${rawDecks.length} decks for user ${userId}`)
  if (rawDecks.length > 0) {
    const allDeck = rawDecks.find((deck) => deck.id === "all")
    console.log(`[flashcards-stream] All deck has ${allDeck?.flashcards.length ?? 0} cards`)
    rawDecks.forEach((deck) => {
      console.log(`[flashcards-stream] Deck "${deck.name}" (${deck.id}): ${deck.flashcards.length} cards`)
    })
  }
  
  const decks: FlashcardDeck[] = rawDecks.map((deck) => ({
    id: deck.id,
    name: deck.name,
    description: deck.description,
    flashcards: deck.flashcards,
  }))
  const totalCards =
    rawDecks.find((deck) => deck.id === "all")?.flashcards.length ??
    rawDecks.reduce((acc, deck) => acc + deck.flashcards.length, 0)

  console.log(`[flashcards-stream] Total cards: ${totalCards}`)

  return <FlashcardWorkspaceClient decks={decks} totalCards={totalCards} />
}

