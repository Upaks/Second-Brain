import { randomUUID } from "node:crypto"

import { type NextRequest, NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/session"
import { prisma } from "@/lib/db"
import { uploadToStorage } from "@/lib/storage"
import { processIngestItemById } from "@/lib/ingest"
import { queueIngestProcessing } from "@/lib/inngest/events"

function sanitizeFileName(name: string) {
  const trimmed = name.trim() || "file"
  const parts = trimmed.split(".")
  const ext = parts.length > 1 ? parts.pop() ?? "" : ""
  const base = parts.join(".")
  const normalized = base
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9-_\s]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()

  const safeBase = normalized || "file"
  const safeExt = ext ? `.${ext.toLowerCase()}` : ""
  return `${safeBase}${safeExt}`
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const bucket = process.env.STORAGE_BUCKET
    if (!bucket) {
      return NextResponse.json({ error: "Storage bucket not configured" }, { status: 500 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const safeName = sanitizeFileName(file.name)
    const path = `${user.id}/${Date.now()}-${randomUUID()}-${safeName}`

    await uploadToStorage({
      bucket,
      path,
      data: buffer,
      contentType: file.type,
    })

    const fileRecord = await prisma.file.create({
      data: {
        userId: user.id,
        key: path,
        name: file.name,
        size: file.size,
        mime: file.type,
      },
    })

    let ingestType: "PDF" | "IMAGE" | "AUDIO" | "TEXT" = "PDF"
    if (file.type.startsWith("image/")) ingestType = "IMAGE"
    else if (file.type.startsWith("audio/")) ingestType = "AUDIO"
    else if (file.type.startsWith("text/")) ingestType = "TEXT"

    const ingestItem = await prisma.ingestItem.create({
      data: {
        userId: user.id,
        type: ingestType,
        source: "upload",
        mime: file.type,
        status: "PENDING",
        meta: {
          fileId: fileRecord.id,
          storage: {
            bucket,
            path,
            contentType: file.type,
            name: file.name,
            size: file.size,
          },
        },
      },
    })

    const queued = await queueIngestProcessing(ingestItem.id)
    if (!queued) {
      await processIngestItemById(ingestItem.id)
    }

    return NextResponse.json({
      ingestItemId: ingestItem.id,
      status: queued ? "QUEUED" : "COMPLETED",
      fileId: fileRecord.id,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
