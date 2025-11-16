import { NextRequest, NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { fetchRecentInsights } from "@/lib/data/dashboard"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cacheBust = searchParams.get("_t") // Cache-busting parameter

  // If cache-busting parameter is present, bypass cache and fetch directly from DB
  // This ensures we get fresh data after new insights are created
  const insights = await fetchRecentInsights(user.id)
  
  return NextResponse.json(
    { insights },
    {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    },
  )
}

