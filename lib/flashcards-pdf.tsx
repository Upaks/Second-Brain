import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { FlashcardDeckData } from "./flashcards-server"

const PAGE_WIDTH = 595.28 // A4 width
const PAGE_HEIGHT = 841.89 // A4 height
const MARGIN = 48

export async function generateFlashcardsPdf(deck: FlashcardDeckData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let cursorY = PAGE_HEIGHT - MARGIN

  const sanitize = (value: string) => {
    const replacements: Record<string, string> = {
      "→": "->",
      "–": "-",
      "—": "-",
      "“": '"',
      "”": '"',
      "‘": "'",
      "’": "'",
      "●": "•",
    }
    return value
      .split("")
      .map((char) => {
        if (replacements[char]) return replacements[char]
        if (char.charCodeAt(0) > 255) return "?"
        return char
      })
      .join("")
  }

  const drawText = (
    text: string,
    options: { font?: any; size?: number; color?: [number, number, number]; indent?: number },
  ) => {
    text = sanitize(text)
    const { font = fontRegular, size = 11, color = [0.12, 0.15, 0.22], indent = 0 } = options
    const maxWidth = PAGE_WIDTH - MARGIN * 2 - indent
    const approxCharWidth = size * 0.55
    const maxCharsPerLine = Math.max(20, Math.floor(maxWidth / approxCharWidth))
    const regex = new RegExp(`(.{1,${maxCharsPerLine}})(\\s|$)`, "g")
    const lines = [...text.trim().matchAll(regex)].map((match) => match[1].trim()).filter(Boolean)
    if (lines.length === 0) lines.push(text)

    lines.forEach((line) => {
      if (cursorY - size < MARGIN) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
        cursorY = PAGE_HEIGHT - MARGIN
      }
      page.drawText(line, {
        x: MARGIN + indent,
        y: cursorY,
        size,
        font,
        color: rgb(color[0], color[1], color[2]),
      })
      cursorY -= size + 4
    })
  }

  drawText(deck.name, { font: fontBold, size: 22, color: [0.07, 0.09, 0.15] })
  cursorY -= 4
  drawText(`Flashcards generated from your insights • ${deck.flashcards.length} cards`, {
    font: fontRegular,
    size: 10,
    color: [0.42, 0.45, 0.52],
  })
  cursorY -= 12

  deck.flashcards.forEach((card, index) => {
    if (cursorY < MARGIN + 160) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      cursorY = PAGE_HEIGHT - MARGIN
    }

    drawText(`${index + 1}. ${card.question}`, {
      font: fontBold,
      size: 14,
      color: [0.07, 0.09, 0.15],
    })

    drawText(card.answer, { size: 11 })

    if (card.keyPoints.length) {
      cursorY -= 6
      drawText("Key points", { font: fontBold, size: 10, color: [0.42, 0.45, 0.52] })
      card.keyPoints.forEach((point) => drawText(`• ${point}`, { size: 10, indent: 12 }))
    }

    if (card.followUpPrompts.length) {
      cursorY -= 6
      drawText("Reflection prompts", { font: fontBold, size: 10, color: [0.42, 0.45, 0.52] })
      card.followUpPrompts.forEach((prompt) => drawText(`? ${prompt}`, { size: 10, indent: 12 }))
    }

    cursorY -= 4
    drawText(`Difficulty: ${card.difficulty}`, { font: fontBold, size: 9 })

    if (card.tags.length) {
      drawText(`Tags: ${card.tags.join(", ")}`, { size: 9, color: [0.26, 0.22, 0.79], indent: 12 })
    }

    if (card.source?.url) {
      drawText(`Source: ${card.source.title ?? card.source.url}`, { size: 9, color: [0.14, 0.39, 0.92], indent: 12 })
    }

    cursorY -= 12
  })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

