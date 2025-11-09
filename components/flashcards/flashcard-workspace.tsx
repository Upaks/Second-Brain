"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  DndContext,
  PointerSensor,
  DragEndEvent,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Flashcard } from "@/lib/flashcards"
import { FlashcardCard } from "./flashcard-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Download, Loader2, Maximize2, Rows2, Rows3, Rows, Share2, Wand2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { StudySession } from "./study-session"
import Link from "next/link"

const cardThemes = [
  { id: "default", label: "Classic", swatch: "bg-white" },
  { id: "midnight", label: "Midnight", swatch: "bg-slate-900" },
  {
    id: "sunrise",
    label: "Sunrise",
    swatch: "bg-gradient-to-br from-amber-300 via-rose-200 to-emerald-200",
  },
  {
    id: "nebula",
    label: "Nebula",
    swatch: "bg-gradient-to-br from-indigo-700 via-purple-600 to-cyan-500",
  },
] as const

const boardBackgrounds = [
  { id: "plain", label: "Neutral", className: "bg-slate-50" },
  {
    id: "warm",
    label: "Sunset wash",
    className: "bg-gradient-to-br from-rose-200/60 via-amber-200/60 to-orange-200/60",
  },
  {
    id: "cool",
    label: "Aurora mist",
    className: "bg-gradient-to-br from-sky-200/60 via-indigo-200/60 to-violet-200/60",
  },
] as const

const cardSizes = [
  { id: "sm", label: "Compact" },
  { id: "md", label: "Comfort" },
  { id: "lg", label: "Spacious" },
] as const

const fonts = [
  { id: "sans", label: "Sans" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Mono" },
] as const

const heroGradients = [
  "bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_55%)]",
  "bg-[radial-gradient(circle_at_top_right,_rgba(236,72,153,0.35),_transparent_50%)]",
  "bg-[radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.25),_transparent_50%)]",
] as const

type LayoutMode = "grid" | "stack" | "storyboard"

const layoutClasses: Record<LayoutMode, string> = {
  grid: "grid gap-6 sm:grid-cols-2 xl:grid-cols-3",
  stack: "flex flex-col gap-4",
  storyboard: "grid auto-rows-[minmax(220px,auto)] gap-6 md:grid-cols-3",
}

export interface FlashcardDeck {
  id: string
  name: string
  description?: string
  flashcards: Flashcard[]
}

interface FlashcardWorkspaceProps {
  decks: FlashcardDeck[]
  totalInsights: number
}

interface SortableFlashcardProps {
  card: Flashcard
  showBack: boolean
  cardTheme: string
  cardSize: "sm" | "md" | "lg"
  fontFamily: "sans" | "serif" | "mono"
  isSelected: boolean
  onSelect: (card: Flashcard) => void
}

function uniqueTagList(cards: Flashcard[]): string[] {
  const tagSet = new Set<string>()
  cards.forEach((card) => {
    card.tags.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet)
}

function SortableFlashcard({
  card,
  showBack,
  cardTheme,
  cardSize,
  fontFamily,
  isSelected,
  onSelect,
}: SortableFlashcardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className={cn("cursor-grab active:cursor-grabbing", isDragging && "z-50 scale-105")}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(card)
      }}
    >
      <FlashcardCard
        card={card}
        showBack={showBack}
        theme={cardTheme as any}
        size={cardSize}
        font={fontFamily}
        isSelected={isSelected}
      />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function ControlColumn({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  )
}

export function FlashcardWorkspace({ decks, totalInsights }: FlashcardWorkspaceProps) {
  const [selectedDeckId, setSelectedDeckId] = useState(() => decks[0]?.id ?? "")
  const [cards, setCards] = useState<Flashcard[]>(decks[0]?.flashcards ?? [])
  const [theme, setTheme] = useState<string>("default")
  const [cardSize, setCardSize] = useState<"sm" | "md" | "lg">("md")
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">("sans")
  const [boardBackground, setBoardBackground] = useState<string>("plain")
  const [showFace, setShowFace] = useState<"front" | "back">("front")
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid")
  const [focusCard, setFocusCard] = useState<Flashcard | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isStudyOpen, setIsStudyOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false)
  const [hasCopiedShareUrl, setHasCopiedShareUrl] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const deck = decks.find((d) => d.id === selectedDeckId)
    if (deck) {
      setCards(deck.flashcards)
      setFocusCard(null)
    }
  }, [selectedDeckId, decks])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const selectedDeck = useMemo(() => decks.find((d) => d.id === selectedDeckId), [selectedDeckId, decks])
  const uniqueTags = useMemo(() => uniqueTagList(cards), [cards])

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setCards((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id)
      const newIndex = prev.findIndex((item) => item.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  type ExportFormat = "json" | "csv" | "pdf" | "anki" | "quizlet" | "notion"

  async function handleExport(format: ExportFormat) {
    if (!selectedDeck || isExporting) return
    setIsExporting(true)
    try {
      const filenameBase = selectedDeck.name.replace(/\s+/g, "-").toLowerCase()
      const res = await fetch("/api/flashcards/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckId: selectedDeck.id,
          format,
          order: cards.map((card) => card.id),
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error?.error ?? "Failed to export flashcards.")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const extensionMap: Record<ExportFormat, string> = {
        json: "json",
        csv: "csv",
        pdf: "pdf",
        notion: "csv",
        anki: "tsv",
        quizlet: "txt",
      }
      link.href = url
      link.download = `${filenameBase}-flashcards.${extensionMap[format] ?? "txt"}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[flashcards] export error", error)
      alert("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  async function handleShareDeck() {
    const deck = selectedDeck
    if (!deck) return
    if (deck.flashcards.length === 0) {
      setShareError("This deck is empty. Add some insights before sharing.")
      setShareUrl(null)
      setIsShareDialogOpen(true)
      return
    }

    setIsGeneratingShareLink(true)
    setShareError(null)
    setHasCopiedShareUrl(false)

    try {
      const res = await fetch("/api/flashcards/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId: deck.id }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error?.error ?? "Failed to create share link")
      }

      const data = (await res.json()) as { url?: string }
      if (!data.url) {
        throw new Error("Share link missing from response")
      }

      setShareUrl(data.url)
      setIsShareDialogOpen(true)
    } catch (error) {
      console.error("[flashcards-share] generate link error", error)
      setShareError(error instanceof Error ? error.message : "Failed to create share link")
      setShareUrl(null)
      setIsShareDialogOpen(true)
    } finally {
      setIsGeneratingShareLink(false)
    }
  }

  async function handleCopyShareUrl() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setHasCopiedShareUrl(true)
    } catch (error) {
      console.error("[flashcards-share] clipboard error", error)
      setHasCopiedShareUrl(false)
    }
  }

  function handleShareDialogChange(open: boolean) {
    setIsShareDialogOpen(open)
    if (!open) {
      setShareError(null)
      setShareUrl(null)
      setHasCopiedShareUrl(false)
    }
  }

  const deckName = selectedDeck?.name ?? "All insights"
  const deckDescription =
    selectedDeck?.description ??
    "Arrange, remix, and reinforce the ideas that matter without losing the context that made them meaningful."

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-8 text-slate-100 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.65)]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-slate-900/40 to-slate-950/80" />
        {heroGradients.map((gradient, idx) => (
          <div key={idx} className={cn("pointer-events-none absolute inset-0 mix-blend-screen", gradient)} />
        ))}
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-5">
            <Badge variant="secondary" className="bg-white/10 text-white/80">
              Deck overview
            </Badge>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{deckName}</h1>
              <p className="max-w-xl text-sm text-slate-200/80">{deckDescription}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2 bg-white text-slate-900 hover:bg-slate-100" onClick={() => setIsStudyOpen(true)}>
                <Wand2 className="h-4 w-4" />
                Launch study session
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    className="gap-2 border border-white/20 bg-white/10 text-white hover:bg-white/20"
                    disabled={isExporting}
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Export deck
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>Standard exports</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleExport("json")}>JSON (structured)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("csv")}>CSV (spreadsheet)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("pdf")}>PDF (printable)</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Bring it to other tools</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleExport("anki")}>Anki TSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("quizlet")}>Quizlet text</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("notion")}>Notion CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                className="gap-2 text-white/80 hover:bg-white/10"
                onClick={handleShareDeck}
                disabled={isGeneratingShareLink || !selectedDeck || selectedDeck.flashcards.length === 0}
              >
                {isGeneratingShareLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                Share deck
              </Button>
            </div>
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-[420px]">
            <StatCard label="Cards in deck" value={cards.length} />
            <StatCard label="Unique tags" value={uniqueTags.length} />
            <StatCard label="Insights captured" value={totalInsights} />
            <StatCard
              label="Last added"
              value={
                cards[0]?.createdAt
                  ? new Date(cards[0].createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  : "—"
              }
            />
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr,320px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <Tabs value={showFace} onValueChange={(value) => setShowFace(value as "front" | "back")}>
                <TabsList>
                  <TabsTrigger value="front">Front view</TabsTrigger>
                  <TabsTrigger value="back">Back view</TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select a deck" />
                </SelectTrigger>
                <SelectContent align="end">
                  {decks.map((deck) => (
                    <SelectItem key={deck.id} value={deck.id}>
                      {deck.name} ({deck.flashcards.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ControlColumn label="Card theme">
                <div className="flex flex-wrap gap-2">
                  {cardThemes.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      title={option.label}
                      onClick={() => setTheme(option.id)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border transition-all",
                        theme === option.id ? "border-primary ring-2 ring-primary/40" : "border-slate-200",
                      )}
                    >
                      <span className={cn("h-7 w-7 rounded-full border border-white/10", option.swatch)} />
                    </button>
                  ))}
                </div>
              </ControlColumn>

              <ControlColumn label="Card size">
                <div className="flex flex-wrap gap-2">
                  {cardSizes.map((entry) => (
                    <Button
                      key={entry.id}
                      variant={cardSize === entry.id ? "default" : "outline"}
                      size="sm"
                      className="rounded-full px-3"
                      onClick={() => setCardSize(entry.id as typeof cardSize)}
                    >
                      {entry.label}
                    </Button>
                  ))}
                </div>
              </ControlColumn>

              <ControlColumn label="Typeface">
                <div className="flex flex-wrap gap-2">
                  {fonts.map((entry) => (
                    <Button
                      key={entry.id}
                      variant={fontFamily === entry.id ? "default" : "outline"}
                      size="sm"
                      className="rounded-full px-3 capitalize"
                      onClick={() => setFontFamily(entry.id as typeof fontFamily)}
                    >
                      {entry.label}
                    </Button>
                  ))}
                </div>
              </ControlColumn>

              <ControlColumn label="Layout mode">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={layoutMode === "grid" ? "default" : "outline"}
                    size="icon"
                    className="rounded-full"
                    onClick={() => setLayoutMode("grid")}
                  >
                    <Rows3 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={layoutMode === "stack" ? "default" : "outline"}
                    size="icon"
                    className="rounded-full"
                    onClick={() => setLayoutMode("stack")}
                  >
                    <Rows2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={layoutMode === "storyboard" ? "default" : "outline"}
                    size="icon"
                    className="rounded-full"
                    onClick={() => setLayoutMode("storyboard")}
                  >
                    <Rows className="h-4 w-4" />
                  </Button>
                </div>
              </ControlColumn>

              <ControlColumn label="Canvas mood" className="md:col-span-2 xl:col-span-4">
                <Select value={boardBackground} onValueChange={setBoardBackground}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Canvas" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {boardBackgrounds.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ControlColumn>
            </div>
          </div>

          <div
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
            onClick={() => setFocusCard(null)}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.18)_1px,transparent_1px)] bg-[size:28px_28px]" />
            <div
              className={cn(
                "pointer-events-none absolute inset-0 opacity-50 mix-blend-multiply",
                boardBackgrounds.find((entry) => entry.id === boardBackground)?.className ?? "bg-slate-50",
              )}
            />
            <div className="relative p-8">
              {cards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300/70 bg-slate-50/70 p-10 text-center text-sm text-slate-500">
                  No flashcards available for this deck yet.
                </div>
              ) : isMounted ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={cards.map((card) => card.id)} strategy={rectSortingStrategy}>
                    <div className={cn(layoutClasses[layoutMode], "gap-6")}>
                      {cards.map((card) => (
                        <SortableFlashcard
                          key={card.id}
                          card={card}
                          showBack={showFace === "back"}
                          cardTheme={theme}
                          cardSize={cardSize}
                          fontFamily={fontFamily}
                          isSelected={focusCard?.id === card.id}
                          onSelect={setFocusCard}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className={cn(layoutClasses[layoutMode], "gap-6")}>
                  {cards.map((card) => (
                    <FlashcardCard
                      key={card.id}
                      card={card}
                      showBack={showFace === "back"}
                      theme={theme as any}
                      size={cardSize}
                      font={fontFamily}
                      isSelected={focusCard?.id === card.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/85 shadow-xl backdrop-blur lg:flex">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold leading-tight text-slate-900">Card inspector</h3>
                <p className="text-xs text-slate-500">
                  {focusCard ? "Fine-tune individual card details." : "Select any card to inspect and edit."}
                </p>
              </div>
              {focusCard && (
                <Button size="icon" variant="ghost" className="text-slate-500 hover:text-slate-900">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="flex-1 px-6 py-5">
            {focusCard ? (
              <div className="space-y-6 text-sm text-slate-700">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Question</p>
                  <p className="rounded-xl bg-slate-100/80 p-3 leading-relaxed shadow-inner">{focusCard.question}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Answer</p>
                  <p className="rounded-xl bg-emerald-50/80 p-3 leading-relaxed text-emerald-900 shadow-inner">
                    {focusCard.answer || "—"}
                  </p>
                </div>
                {focusCard.keyPoints.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Key points</p>
                    <ul className="space-y-1 rounded-xl bg-slate-100/70 p-3 shadow-inner">
                      {focusCard.keyPoints.map((point, index) => (
                        <li key={index} className="flex gap-2 text-slate-600">
                          <span>•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {focusCard.followUpPrompts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Reflection prompts</p>
                    <ul className="space-y-1 rounded-xl bg-slate-100/70 p-3 shadow-inner">
                      {focusCard.followUpPrompts.map((prompt, index) => (
                        <li key={index} className="flex gap-2 text-slate-600">
                          <span>?</span>
                          <span>{prompt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full bg-slate-900 text-white">
                    {focusCard.difficulty}
                  </Badge>
                  {focusCard.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {focusCard.source?.url && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Source</p>
                    <a
                      href={focusCard.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
                    >
                      {focusCard.source.title ?? focusCard.source.url}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Select a card on the canvas to inspect its details.
              </div>
            )}
          </ScrollArea>
        </div>
      </section>

      <Dialog open={isShareDialogOpen} onOpenChange={handleShareDialogChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Share this deck</DialogTitle>
            <DialogDescription>
              Anyone with the link can browse a read-only version. Links automatically expire after seven days.
            </DialogDescription>
          </DialogHeader>

          {shareError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {shareError}
            </div>
          ) : shareUrl ? (
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Share link</label>
              <div className="flex items-center gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-xs" />
                <Button onClick={handleCopyShareUrl} variant="secondary" className="shrink-0">
                  {hasCopiedShareUrl ? "Copied" : "Copy"}
                </Button>
                <Button asChild variant="outline" className="shrink-0">
                  <Link href={shareUrl} target="_blank" rel="noopener noreferrer">
                    Preview
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Tip: send this link to collaborators. They can preview cards without affecting your workspace.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-slate-200/60 bg-slate-100/40 p-6 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating secure share link…
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isStudyOpen} onOpenChange={setIsStudyOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] overflow-hidden border border-slate-200 bg-white p-0 shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-lg font-semibold text-slate-900">Study session</DialogTitle>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-y-auto px-6 pb-6">
            <StudySession
              deckName={deckName}
              flashcards={selectedDeck?.flashcards ?? []}
              onExit={() => setIsStudyOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
