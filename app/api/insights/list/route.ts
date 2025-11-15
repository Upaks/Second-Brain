import { NextRequest, NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { getInsightsGrid } from "@/lib/data/dashboard"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get("cursor") ?? undefined
  const tag = searchParams.get("tag") ?? undefined

  const data = await getInsightsGrid(user.id, { cursor, tag })
  return NextResponse.json(data)
}

