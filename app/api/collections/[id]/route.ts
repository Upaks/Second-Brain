import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/db"
import { revalidateCollections } from "@/lib/cache/tags"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description } = body

    // Verify ownership
    const collection = await prisma.collection.findUnique({
      where: { id, userId: user.id },
    })

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: {
        name: name || collection.name,
        description,
      },
    })

    revalidateCollections(user.id)
    return NextResponse.json(updated)
  } catch (error) {
    console.error("[v0] Update collection error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const collection = await prisma.collection.findUnique({
      where: { id, userId: user.id },
    })

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    await prisma.collection.delete({
      where: { id },
    })

    revalidateCollections(user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete collection error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
