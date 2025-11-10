import { NextResponse, type NextRequest } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { getDeckById } from "@/lib/flashcards-server"
import { createShareToken } from "@/lib/flashcards-share"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const deckId = typeof body.deckId === "string" && body.deckId.trim() ? body.deckId.trim() : "all"
    const expiresIn = typeof body.expiresIn === "string" || typeof body.expiresIn === "number" ? body.expiresIn : "7d"
    const acceptedIdsRaw = body.acceptedIds
    const acceptedIds = Array.isArray(acceptedIdsRaw)
      ? acceptedIdsRaw.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
      : []

    const deck = await getDeckById(user.id, deckId)
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 })
    }

    if (deck.flashcards.length === 0 || acceptedIds.length === 0) {
      return NextResponse.json({ error: "Deck has no flashcards to share" }, { status: 400 })
    }

    const cardSet = new Set(deck.flashcards.map((card) => card.id))
    const allowedCardIds = acceptedIds.filter((id) => cardSet.has(id))
    if (allowedCardIds.length === 0) {
      return NextResponse.json({ error: "No approved flashcards available to share" }, { status: 400 })
    }

    const token = createShareToken({ deckId, userId: user.id, cardIds: allowedCardIds, expiresIn })
    const origin = request.headers.get("origin") ?? new URL(request.url).origin
    const shareUrl = `${origin}/share/${token}`

    return NextResponse.json({ url: shareUrl, expiresIn })
  } catch (error) {
    console.error("[flashcards-share] create link error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
