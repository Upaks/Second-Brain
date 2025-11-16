import { Prisma, type IngestItem } from "@prisma/client"
import PdfParser from "pdf2json"
import { Readability } from "@mozilla/readability"
import { JSDOM } from "jsdom"
import mammoth from "mammoth"
import JSZip from "jszip"
import { XMLParser } from "fast-xml-parser"

import { prisma } from "./db"
import { revalidateFlashcards } from "./cache/tags"
import { generateEmbedding } from "./ai/embed"
import { generateStructuredInsightsFromText } from "./ai/summarize"
import { setInsightEmbedding, upsertTagsForInsight } from "./insights"
import { downloadFromStorage } from "./storage"
import { extractTextFromAudio, extractTextFromImage } from "./ai/extract"

interface ProcessOptions {
  item: Pick<IngestItem, "id" | "userId" | "type" | "rawText" | "meta"> & {
    rawText: string | null
    meta: IngestItem["meta"]
  }
}

async function fetchUrlContents(url: string) {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "SecondBrainBot/0.1" } })
    if (!response.ok) return null
    const html = await response.text()

    let cleaned = ""
    try {
      const dom = new JSDOM(html, { url })
      const reader = new Readability(dom.window.document)
      const article = reader.parse()
      if (article) {
        const parts = [article.title ?? "", article.textContent ?? ""].map((part) => part.trim()).filter(Boolean)
        cleaned = parts.join("\n\n").trim()
      }
      dom.window.close()
    } catch (error) {
      console.warn("[ingest] readability extraction failed", error)
    }

    if (!cleaned) {
      cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    }

    return cleaned
  } catch (error) {
    console.error("[ingest] fetch url error", error)
    return null
  }
}

async function extractPdfText(buffer: Buffer) {
  return await new Promise<string>((resolve, reject) => {
    const parser = new PdfParser()

    parser.on("pdfParser_dataError", (errData: any) => {
      console.error("[ingest] pdf parse error", errData.parserError)
      parser.destroy?.()
      parser.removeAllListeners()
      resolve("")
    })

    parser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        const text = pdfData?.Pages?.map((page: any) =>
          page.Texts?.map((textItem: any) =>
            decodeURIComponent(textItem.R.map((r: any) => r.T).join(""))
              .replace(/\+/g, " ")
              .trim(),
          )
            .filter(Boolean)
            .join(" "),
        )
          .filter(Boolean)
          .join("\n")

        resolve(text ?? "")
      } catch (error) {
        console.error("[ingest] pdf parse error", error)
        resolve("")
      } finally {
        parser.destroy?.()
        parser.removeAllListeners()
      }
    })

    try {
      parser.parseBuffer(buffer)
    } catch (error) {
      console.error("[ingest] pdf parse error", error)
      parser.destroy?.()
      parser.removeAllListeners()
      resolve("")
    }
  })
}

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength)
  new Uint8Array(arrayBuffer).set(buffer)
  return arrayBuffer
}

async function extractDocxText(buffer: Buffer) {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: bufferToArrayBuffer(buffer) })
    return result.value?.trim() ?? ""
  } catch (error) {
    console.error("[ingest] docx extraction error", error)
    return ""
  }
}

function collectPptxText(node: unknown): string[] {
  if (node === null || node === undefined) return []
  if (typeof node === "string") return [node]
  if (Array.isArray(node)) {
    return node.flatMap((item) => collectPptxText(item))
  }

  if (typeof node === "object") {
    const result: string[] = []
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith("@_")) continue
      if (key === "a:br") {
        result.push("\n")
        continue
      }
      if (key === "a:t") {
        result.push(...collectPptxText(value))
        continue
      }
      result.push(...collectPptxText(value))
    }
    return result
  }

  return []
}

async function extractPptxText(buffer: Buffer) {
  try {
    const zip = await JSZip.loadAsync(buffer)
    const parser = new XMLParser({ ignoreAttributes: false })
    const slideFiles = Object.keys(zip.files)
      .filter((path) => path.startsWith("ppt/slides/slide") && path.endsWith(".xml"))
      .sort()

    const slideTexts: string[] = []

    for (const path of slideFiles) {
      const file = zip.file(path)
      if (!file) continue
      const xml = await file.async("text")
      const parsed = parser.parse(xml)
      const textChunks = collectPptxText(parsed)
        .map((chunk) => chunk.trim())
        .filter(Boolean)
      if (textChunks.length) {
        slideTexts.push(textChunks.join(" "))
      }
    }

    return slideTexts.join("\n\n").trim()
  } catch (error) {
    console.error("[ingest] pptx extraction error", error)
    return ""
  }
}

async function extractTextFromStorage(meta: any) {
  if (!meta?.storage) return ""
  const { bucket, path, contentType, name } = meta.storage as {
    bucket: string
    path: string
    contentType?: string
    name?: string
  }

  if (!bucket || !path) return ""

  try {
    const buffer = await downloadFromStorage({ bucket, path })
    const mime = contentType ?? "application/octet-stream"

    if (mime.startsWith("text/")) {
      return buffer.toString("utf-8")
    }

    if (mime === "application/pdf") {
      return await extractPdfText(buffer)
    }

    if (mime.startsWith("image/")) {
      return await extractTextFromImage(buffer, mime)
    }

    if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name?.toLowerCase().endsWith(".docx")
    ) {
      return await extractDocxText(buffer)
    }

    if (
      mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      name?.toLowerCase().endsWith(".pptx")
    ) {
      return await extractPptxText(buffer)
    }

    if (mime.startsWith("audio/")) {
      return await extractTextFromAudio(buffer, mime)
    }

    console.warn(`[ingest] Unsupported file type for extraction: ${mime}`)
    return `Captured file ${name ?? path}`
  } catch (error) {
    console.error("[ingest] storage extraction error", error)
    return ""
  }
}

export async function processIngestItem({ item }: ProcessOptions) {
  // Status is already set to PROCESSING by processIngestItemById
  // No need to update again here

  try {
    const userId = item.userId
    let content = item.rawText ?? ""

    if (item.type === "URL") {
      const url =
        typeof item.meta === "object" && item.meta && "url" in item.meta ? String(item.meta.url) : content
      if (url) {
        const fetched = await fetchUrlContents(url)
        content = fetched ?? url
      }
    }

    if ((!content || !content.trim()) && item.meta) {
      const extracted = await extractTextFromStorage(item.meta)
      if (extracted) {
        content = extracted
        await prisma.ingestItem.update({
          where: { id: item.id },
          data: { rawText: extracted },
        })
      }
    }

    const structured = await generateStructuredInsightsFromText(content || "Captured content")

    const existingInsightsRaw = await prisma.$queryRaw<Array<{ id: string; sectionIndex: number | null }>>`
      SELECT "id", "sectionIndex"
      FROM "Insight"
      WHERE "ingestItemId" = ${item.id}
    `

    const existingInsights = existingInsightsRaw.sort((a, b) => {
      const aIndex = typeof a.sectionIndex === "number" ? a.sectionIndex : Number.MAX_SAFE_INTEGER
      const bIndex = typeof b.sectionIndex === "number" ? b.sectionIndex : Number.MAX_SAFE_INTEGER
      return aIndex - bIndex
    })

    const processedInsightIds: string[] = []

    for (const [index, generated] of structured.insights.entries()) {
      const existing = existingInsights[index]
      const summary = generated.bullets.join("\n")
      const insightContent = generated.source_excerpt?.trim() || content

      const insight = existing
        ? await prisma.$queryRaw<
            Array<{ id: string; title: string; summary: string; takeaway: string; content: string | null }>
          >`
            UPDATE "Insight"
            SET "title" = ${generated.title},
                "summary" = ${summary},
                "takeaway" = ${generated.takeaway},
                "content" = ${insightContent},
                "sectionIndex" = ${index},
                "sectionLabel" = ${generated.title},
                "updatedAt" = NOW()
            WHERE "id" = ${existing.id}
            RETURNING "id", "title", "summary", "takeaway", "content"
          `
        : await prisma.$queryRaw<
            Array<{ id: string; title: string; summary: string; takeaway: string; content: string | null }>
          >`
            INSERT INTO "Insight" ("id", "userId", "title", "summary", "takeaway", "content", "ingestItemId", "sectionIndex", "sectionLabel", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), ${userId}, ${generated.title}, ${summary}, ${generated.takeaway}, ${insightContent}, ${item.id}, ${index}, ${generated.title}, NOW(), NOW())
            RETURNING "id", "title", "summary", "takeaway", "content"
          `

      const updatedInsight = Array.isArray(insight) ? insight[0] : (insight as any)
      if (!updatedInsight) {
        throw new Error("Failed to upsert insight section")
      }

      processedInsightIds.push(updatedInsight.id)

      await upsertTagsForInsight(userId, updatedInsight.id, generated.tags ?? [])

      const embedding = await generateEmbedding(`${generated.takeaway}\n${generated.bullets.join("\n")}`)
      if (embedding.length) {
        await setInsightEmbedding(updatedInsight.id, embedding)
      }
    }

    if (existingInsights.length > structured.insights.length) {
      const excess = existingInsights.slice(structured.insights.length)
      const excessIds = excess.map((insight) => insight.id)
      if (excessIds.length) {
        const idArray = Prisma.join(excessIds.map((id) => Prisma.sql`${id}::uuid`))
        await prisma.$executeRaw`
          DELETE FROM "Insight"
          WHERE "id" = ANY(ARRAY[${idArray}]::uuid[])
        `
      }
    }

    const metaUpdate =
      item.meta && typeof item.meta === "object" && !Array.isArray(item.meta)
        ? { ...item.meta }
        : {}
    metaUpdate.structured = {
      summary: structured.summary ?? null,
      sections: structured.insights.map((insight, index) => ({
        index,
        title: insight.title,
        takeaway: insight.takeaway,
      })),
    }

    await prisma.ingestItem.update({
      where: { id: item.id },
      data: {
        status: "DONE",
        processedAt: new Date(),
        rawText: content,
        meta: metaUpdate,
      },
    })

    revalidateFlashcards(userId)

    return { insightIds: processedInsightIds, ingestItemId: item.id, reused: existingInsights.length > 0 }
  } catch (error) {
    await prisma.ingestItem.update({
      where: { id: item.id },
      data: {
        status: "ERROR",
        processedAt: new Date(),
      },
    })
    throw error
  }
}

export async function processIngestItemById(ingestItemId: string) {
  // First, check the current status and only proceed if it's PENDING
  const currentItem = await prisma.ingestItem.findUnique({
    where: { id: ingestItemId },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  })

  if (!currentItem) {
    throw new Error(`Ingest item ${ingestItemId} not found`)
  }

  // If item is stuck in PROCESSING for more than 1 hour, reset it to PENDING
  // This handles cases where processing crashed or was interrupted
  if (currentItem.status === "PROCESSING") {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    if (currentItem.createdAt < oneHourAgo) {
      console.log(`[ingest] Resetting stuck item ${ingestItemId} from PROCESSING to PENDING`)
      await prisma.ingestItem.update({
        where: { id: ingestItemId },
        data: { status: "PENDING" },
      })
      // Continue to process it
    } else {
      // Still processing, skip
      console.log(`[ingest] Skipping ${ingestItemId} - still PROCESSING`)
      return { skipped: true, status: currentItem.status }
    }
  }

  // Skip if already done or error to prevent infinite loops
  if (currentItem.status === "DONE" || currentItem.status === "ERROR") {
    console.log(`[ingest] Skipping ${ingestItemId} - already ${currentItem.status}`)
    return { skipped: true, status: currentItem.status }
  }

  // Atomically update status to PROCESSING only if it's PENDING
  // This prevents race conditions when Inngest retries
  const updated = await prisma.ingestItem.updateMany({
    where: {
      id: ingestItemId,
      status: "PENDING", // Only update if still PENDING
    },
    data: {
      status: "PROCESSING",
    },
  })

  // If no rows were updated, another process already claimed it
  if (updated.count === 0) {
    const currentStatus = await prisma.ingestItem.findUnique({
      where: { id: ingestItemId },
      select: { status: true },
    })
    console.log(`[ingest] Item ${ingestItemId} already claimed by another process - status: ${currentStatus?.status}`)
    return { skipped: true, status: currentStatus?.status }
  }

  // Now fetch the full item data for processing
  const ingestItem = await prisma.ingestItem.findUnique({
    where: { id: ingestItemId },
    select: {
      id: true,
      userId: true,
      type: true,
      rawText: true,
      meta: true,
    },
  })

  if (!ingestItem) {
    throw new Error(`Ingest item ${ingestItemId} not found after status update`)
  }

  return processIngestItem({ item: ingestItem })
}

