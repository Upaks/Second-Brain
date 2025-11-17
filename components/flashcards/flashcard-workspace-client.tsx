"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { FlashcardWorkspace, type FlashcardDeck } from "./flashcard-workspace"

interface FlashcardWorkspaceClientProps {
  decks: FlashcardDeck[]
  totalCards: number
}

export function FlashcardWorkspaceClient({ decks, totalCards }: FlashcardWorkspaceClientProps) {
  const router = useRouter()

  useEffect(() => {
    // Check if we need to refresh (e.g., after navigating from a deletion)
    const needsRefresh = sessionStorage.getItem("insights:needsRefresh")
    if (needsRefresh === "true") {
      sessionStorage.removeItem("insights:needsRefresh")
      // Small delay to ensure server cache is cleared
      setTimeout(() => router.refresh(), 200)
    }

    // Listen for insight deletion events
    const handleRefresh = () => {
      router.refresh()
    }
    window.addEventListener("insights:invalidate", handleRefresh)

    return () => {
      window.removeEventListener("insights:invalidate", handleRefresh)
    }
  }, [router])

  return <FlashcardWorkspace decks={decks} totalCards={totalCards} />
}

