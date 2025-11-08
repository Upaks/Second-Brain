import type { IngestItem } from "@prisma/client"
import PdfParser from "pdf2json"
import { Readability } from "@mozilla/readability"
import { JSDOM } from "jsdom"
import mammoth from "mammoth"
import JSZip from "jszip"
import { XMLParser } from "fast-xml-parser"

import { prisma } from "./db"
import { generateEmbedding } from "./ai/embed"
import { generateInsightFromText } from "./ai/summarize"
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
  await prisma.ingestItem.update({
    where: { id: item.id },
    data: { status: "PROCESSING" },
  })

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

    const generated = await generateInsightFromText(content || "Captured content")

    const existingInsight = await prisma.insight.findUnique({
      where: { ingestItemId: item.id },
      select: { id: true },
    })

    const insight = await prisma.insight.upsert({
      where: { ingestItemId: item.id },
      update: {
        title: generated.title,
        summary: generated.bullets.join("\n"),
        takeaway: generated.takeaway,
        content,
      },
      create: {
        userId,
        title: generated.title,
        summary: generated.bullets.join("\n"),
        takeaway: generated.takeaway,
        content,
        ingestItemId: item.id,
      },
    })

    await upsertTagsForInsight(userId, insight.id, generated.tags ?? [])

    const embedding = await generateEmbedding(`${generated.takeaway}\n${generated.bullets.join("\n")}`)
    if (embedding.length) {
      await setInsightEmbedding(insight.id, embedding)
    }

    await prisma.ingestItem.update({
      where: { id: item.id },
      data: {
        status: "DONE",
        processedAt: new Date(),
        rawText: content,
      },
    })

    return { insightId: insight.id, ingestItemId: item.id, reused: Boolean(existingInsight) }
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
    throw new Error(`Ingest item ${ingestItemId} not found`)
  }

  return processIngestItem({ item: ingestItem })
}

