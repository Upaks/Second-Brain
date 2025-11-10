"use client"

import { FlashcardWorkspace, type FlashcardDeck } from "./flashcard-workspace"

interface FlashcardWorkspaceClientProps {
  decks: FlashcardDeck[]
  totalCards: number
}

export function FlashcardWorkspaceClient({ decks, totalCards }: FlashcardWorkspaceClientProps) {
  return <FlashcardWorkspace decks={decks} totalCards={totalCards} />
}

