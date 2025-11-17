import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { revalidateInsights, revalidateTags, revalidateFlashcards } from "@/lib/cache/tags"

export async function POST() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  revalidateInsights(user.id)
  revalidateTags(user.id)
  revalidateFlashcards(user.id)

  return NextResponse.json({ success: true })
}

