"use client"

import { FlashcardWorkspace, type FlashcardDeck } from "./flashcard-workspace"

interface FlashcardWorkspaceClientProps {
  decks: FlashcardDeck[]
  totalInsights: number
}

export function FlashcardWorkspaceClient({ decks, totalInsights }: FlashcardWorkspaceClientProps) {
  return <FlashcardWorkspace decks={decks} totalInsights={totalInsights} />
}

