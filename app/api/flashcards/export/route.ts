import { type NextRequest, NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { flashcardsToCsv } from "@/lib/flashcards"
import { getDeckById } from "@/lib/flashcards-server"
import { generateFlashcardsPdf } from "@/lib/flashcards-pdf"

import type { FlashcardDeckData } from "@/lib/flashcards-server"

function reorderFlashcards(flashcards: FlashcardDeckData["flashcards"], order?: unknown) {
  if (!Array.isArray(order) || order.length === 0) return flashcards
  const map = new Map(flashcards.map((card) => [card.id, card]))
  const seen = new Set<string>()
  const reordered = order
    .map((id) => {
      if (typeof id !== "string") return null
      const card = map.get(id)
      if (card) {
        seen.add(id)
        return card
      }
      return null
    })
    .filter(Boolean) as typeof flashcards

  flashcards.forEach((card) => {
    if (!seen.has(card.id)) {
      reordered.push(card)
    }
  })

  return reordered
}

function streamBuffer(buffer: Uint8Array) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(buffer)
      controller.close()
    },
  })
}

async function handleExport({
  userId,
  deckId,
  format,
  order,
}: {
  userId: string
  deckId: string
  format: string
  order?: unknown
}) {
  const deck = await getDeckById(userId, deckId)
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 })
  }

  const flashcards = reorderFlashcards(deck.flashcards, order)
  const safeName = deck.name.replace(/\s+/g, "-").toLowerCase()

  if (format === "csv") {
    const csv = flashcardsToCsv(flashcards)
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}-flashcards.csv"`,
      },
    })
  }

  if (format === "pdf") {
    const pdfBuffer = await generateFlashcardsPdf({ ...deck, flashcards })
    return new Response(streamBuffer(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}-flashcards.pdf"`,
      },
    })
  }

  if (format === "json") {
    return NextResponse.json({
      deck: {
        id: deck.id,
        name: deck.name,
        description: deck.description,
      },
      flashcards,
    })
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 })
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deckId = searchParams.get("deck") ?? "all"
    const format = (searchParams.get("format") ?? "json").toLowerCase()

    return await handleExport({ userId: user.id, deckId, format })
  } catch (error) {
    console.error("[flashcards] export error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const deckId = typeof body.deckId === "string" ? body.deckId : "all"
    const format = typeof body.format === "string" ? body.format.toLowerCase() : "json"
    const order = body.order

    return await handleExport({ userId: user.id, deckId, format, order })
  } catch (error) {
    console.error("[flashcards] export error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

