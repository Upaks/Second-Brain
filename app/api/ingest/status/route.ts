import { NextResponse, type NextRequest } from "next/server"

import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"

function parseIds(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const explicitIds = params.getAll("id")
  if (explicitIds.length > 0) {
    return explicitIds.filter(Boolean)
  }

  const csv = params.get("ids")
  if (!csv) return []
  return csv
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ids = parseIds(request)
  if (!ids.length) {
    return NextResponse.json({ error: "Missing id query parameter" }, { status: 400 })
  }

  const items = await prisma.ingestItem.findMany({
    where: {
      userId: user.id,
      id: { in: ids },
    },
    select: {
      id: true,
      status: true,
      processedAt: true,
      createdAt: true,
      insight: {
        select: { id: true },
      },
    },
  })

  const byId = new Map(items.map((item) => [item.id, item]))
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((item): item is (typeof items)[number] => Boolean(item))

  return NextResponse.json({
    items: ordered.map((item) => ({
      id: item.id,
      status: item.status,
      processedAt: item.processedAt,
      createdAt: item.createdAt,
      insightId: item.insight?.id ?? null,
    })),
  })
}

