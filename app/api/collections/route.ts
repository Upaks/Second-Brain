import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check if collection with name already exists
    const existing = await prisma.collection.findUnique({
      where: {
        userId_name: {
          userId: user.id,
          name,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: "A collection with this name already exists" }, { status: 409 })
    }

    const collection = await prisma.collection.create({
      data: {
        userId: user.id,
        name,
        description,
      },
    })

    return NextResponse.json(collection)
  } catch (error) {
    console.error("[v0] Create collection error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
