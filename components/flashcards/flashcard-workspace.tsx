"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Download, Loader2, Maximize2, Rows2, Rows3, Rows, PlayCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { StudySession } from "./study-session"

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

const themes = [
  { id: "default", label: "Classic" },
  { id: "midnight", label: "Midnight" },
  { id: "sunrise", label: "Sunrise" },
] as const

const boardBackgrounds = [
  { id: "plain", label: "Neutral", className: "bg-slate-50 dark:bg-slate-900" },
  {
    id: "warm",
    label: "Sunset",
    className: "bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50 dark:from-slate-900 dark:via-slate-950 dark:to-black",
  },
  {
    id: "cool",
    label: "Aurora",
    className: "bg-gradient-to-br from-blue-50 via-sky-100 to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-gray-900",
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

interface SortableFlashcardProps {
  card: Flashcard
  showBack: boolean
  cardTheme: string
  cardSize: "sm" | "md" | "lg"
  fontFamily: "sans" | "serif" | "mono"
  isSelected: boolean
  onSelect: (card: Flashcard) => void
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
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

type LayoutMode = "grid" | "stack" | "storyboard"

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
  const [isMounted, setIsMounted] = useState(false)
  const [studyMode, setStudyMode] = useState<"learn" | "review">("learn")

  useEffect(() => {
    const deck = decks.find((d) => d.id === selectedDeckId)
    if (deck) {
      setCards(deck.flashcards)
      setFocusCard(null)
    }
  }, [selectedDeckId, decks])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const selectedDeck = useMemo(() => decks.find((d) => d.id === selectedDeckId), [selectedDeckId, decks])

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setCards((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id)
      const newIndex = prev.findIndex((item) => item.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const layoutClasses: Record<LayoutMode, string> = {
    grid: "grid gap-6 sm:grid-cols-2 xl:grid-cols-3",
    stack: "flex flex-col gap-4",
    storyboard: "grid auto-rows-[minmax(220px,auto)] gap-6 md:grid-cols-3",
  }

  async function handleExport(format: "json" | "csv" | "pdf") {
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
      const extension = format === "json" ? "json" : format === "csv" ? "csv" : "pdf"
      link.href = url
      link.download = `${filenameBase}-flashcards.${extension}`
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold leading-tight">Flashcards</h2>
            <Badge variant="secondary" className="text-xs">
              Studio
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {cards.length} card{cards.length === 1 ? "" : "s"} in{" "}
            <span className="font-medium">{selectedDeck?.name ?? "deck"}</span> · {totalInsights} insights total
          </p>

          <Tabs value={showFace} onValueChange={(value) => setShowFace(value as "front" | "back")}>
            <TabsList>
              <TabsTrigger value="front">Front view</TabsTrigger>
              <TabsTrigger value="back">Back view</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
            <SelectTrigger className="w-[220px]">
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

          <div className="flex items-center gap-2 rounded-full border bg-background/70 px-4 py-2 shadow-sm">
            {themes.map((option) => (
              <button
                key={option.id}
                onClick={() => setTheme(option.id)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border transition-all",
                  theme === option.id
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border hover:border-primary/40",
                )}
                title={option.label}
                type="button"
              >
                <span
                  className={cn(
                    "h-6 w-6 rounded-full border",
                    option.id === "default" && "bg-white",
                    option.id === "midnight" && "bg-slate-900",
                    option.id === "sunrise" && "bg-gradient-to-br from-amber-200 via-pink-200 to-rose-200",
                  )}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 shadow-sm">
            {cardSizes.map((entry) => (
              <Button
                key={entry.id}
                variant={cardSize === entry.id ? "default" : "ghost"}
                size="sm"
                className="rounded-full"
                onClick={() => setCardSize(entry.id as typeof cardSize)}
              >
                {entry.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 shadow-sm">
            {fonts.map((entry) => (
              <Button
                key={entry.id}
                variant={fontFamily === entry.id ? "default" : "ghost"}
                size="sm"
                className="rounded-full capitalize"
                onClick={() => setFontFamily(entry.id as typeof fontFamily)}
              >
                {entry.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-full border bg-background/70 px-2 py-1.5 shadow-sm">
            <Button
              type="button"
              variant={layoutMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="rounded-full"
              onClick={() => setLayoutMode("grid")}
            >
              <Rows3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={layoutMode === "stack" ? "default" : "ghost"}
              size="icon"
              className="rounded-full"
              onClick={() => setLayoutMode("stack")}
            >
              <Rows2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={layoutMode === "storyboard" ? "default" : "ghost"}
              size="icon"
              className="rounded-full"
              onClick={() => setLayoutMode("storyboard")}
            >
              <Rows className="h-4 w-4" />
            </Button>
          </div>

          <Select value={boardBackground} onValueChange={setBoardBackground}>
            <SelectTrigger className="w-[140px]">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={isExporting}>
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isExporting ? "Exporting…" : "Export"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("json")}>Download JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>Download CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>Download PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div
          className={cn(
            "rounded-3xl border border-dashed p-6 shadow-inner transition-colors",
            boardBackgrounds.find((entry) => entry.id === boardBackground)?.className ??
              boardBackgrounds[0].className,
          )}
          onClick={() => setFocusCard(null)}
        >
          {cards.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground bg-white/60 dark:bg-slate-900/60">
              No flashcards available for this deck yet.
            </div>
          ) : isMounted ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={cards.map((card) => card.id)} strategy={rectSortingStrategy}>
                <div className={cn(layoutClasses[layoutMode])}>
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
            <div className={cn(layoutClasses[layoutMode])}>
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

        <Card className="hidden h-full flex-col overflow-hidden lg:flex">
          <div className="border-b px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold leading-tight">Card inspector</h3>
                <p className="text-xs text-muted-foreground">
                  {focusCard ? "Fine-tune individual card details." : "Select a card to inspect and edit."}
                </p>
              </div>
              {focusCard && (
                <Button size="icon" variant="ghost">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="flex-1 px-5 py-4">
            {focusCard ? (
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Question</div>
                  <p className="mt-1 leading-relaxed">{focusCard.question}</p>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Answer</div>
                  <p className="mt-1 leading-relaxed">{focusCard.answer}</p>
                </div>
                {focusCard.keyPoints.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Key points</div>
                    <ul className="mt-1 space-y-1 text-sm">
                      {focusCard.keyPoints.map((point, index) => (
                        <li key={index} className="flex gap-2">
                          <span>•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {focusCard.followUpPrompts.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Reflection prompts</div>
                    <ul className="mt-1 space-y-1 text-sm">
                      {focusCard.followUpPrompts.map((prompt, index) => (
                        <li key={index} className="flex gap-2">
                          <span>?</span>
                          <span>{prompt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{focusCard.difficulty}</Badge>
                  {focusCard.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {focusCard.source?.url && (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Source</div>
                    <a
                      href={focusCard.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-primary underline"
                    >
                      {focusCard.source.title ?? focusCard.source.url}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Select a card to see its content and theme details.
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full" disabled={!selectedDeck || selectedDeck.flashcards.length === 0}>
            Start Study Session
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Start Study Session</DialogTitle>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-y-auto px-6 pb-6">
            <StudySession
              deckName={selectedDeck?.name ?? "Selected deck"}
              flashcards={selectedDeck?.flashcards ?? []}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

