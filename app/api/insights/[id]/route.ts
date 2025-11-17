import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/db"
import { revalidateInsights, revalidateFlashcards } from "@/lib/cache/tags"

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const insight = await prisma.insight.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!insight || insight.userId !== user.id) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 })
    }

    await prisma.insight.delete({
      where: { id },
    })

    revalidateInsights(user.id)
    revalidateFlashcards(user.id)
    // Force refresh of the flashcards page
    revalidatePath("/dashboard/flashcards")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete insight error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

