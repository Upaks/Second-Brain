import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { FlashcardWorkspaceClient } from "@/components/flashcards/flashcard-workspace-client"
import type { FlashcardDeck } from "@/components/flashcards/flashcard-workspace"
import { getFlashcardDecksForUser } from "@/lib/flashcards-server"

export default async function FlashcardsPage() {
  const user = await requireCurrentUser()

  const rawDecks = await getFlashcardDecksForUser(user.id)
  const decks: FlashcardDeck[] = rawDecks.map((deck) => ({
    id: deck.id,
    name: deck.name,
    description: deck.description,
    flashcards: deck.flashcards,
  }))
  const totalCards =
    rawDecks.find((deck) => deck.id === "all")?.flashcards.length ??
    rawDecks.reduce((acc, deck) => acc + deck.flashcards.length, 0)

  return (
    <DashboardShell user={user}>
      <FlashcardWorkspaceClient decks={decks} totalCards={totalCards} />
    </DashboardShell>
  )
}

