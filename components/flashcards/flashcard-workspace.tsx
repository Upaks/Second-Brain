"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
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

import { Flashcard, type FlashcardCardType, type FlashcardDifficulty } from "@/lib/flashcards"
import { FlashcardCard } from "./flashcard-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Inbox,
  Loader2,
  Maximize2,
  RotateCcw,
  Rows2,
  Rows3,
  Rows,
  Search,
  Share2,
  Wand2,
} from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
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
  totalCards: number
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

const CARD_STATUS_PREFIX = "flashcard-card-status:"
type CardStatus = "accepted" | "skipped" | "new"

function getStoredStatus(cardId: string): CardStatus {
  if (typeof window === "undefined") return "new"
  const value = window.localStorage.getItem(`${CARD_STATUS_PREFIX}${cardId}`)
  return (value as CardStatus | null) ?? "new"
}

function setStoredStatus(cardId: string, status: CardStatus) {
  if (typeof window === "undefined") return
  if (status === "new") {
    window.localStorage.removeItem(`${CARD_STATUS_PREFIX}${cardId}`)
    return
  }
  window.localStorage.setItem(`${CARD_STATUS_PREFIX}${cardId}`, status)
}

export function FlashcardWorkspace({ decks, totalCards }: FlashcardWorkspaceProps) {
  const [selectedDeckId, setSelectedDeckId] = useState(() => decks[0]?.id ?? "")
  const [cards, setCards] = useState<Flashcard[]>([])
  const [pendingCards, setPendingCards] = useState<Flashcard[]>([])
  const [pendingDrafts, setPendingDrafts] = useState<Record<string, { question: string; answer: string }>>({})
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
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [activeReviewCardId, setActiveReviewCardId] = useState<string | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<FlashcardDifficulty | "all">("all")
  const [cardTypeFilter, setCardTypeFilter] = useState<FlashcardCardType | "all">("all")
  const [tagFilter, setTagFilter] = useState<string | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const cardsPerPage = 12
  const [reviewShowFace, setReviewShowFace] = useState<"front" | "back">("front")
  const [inspectorDraft, setInspectorDraft] = useState<{
    question: string
    answer: string
    keyPoints: string
    followUps: string
  } | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (decks.length === 0) return
    if (!selectedDeckId || !decks.some((deck) => deck.id === selectedDeckId)) {
      setSelectedDeckId(decks[0]?.id ?? "")
    }
  }, [decks, selectedDeckId])

  const initialiseDeck = useCallback(
    (deckId: string) => {
      if (!isMounted) return
      const deck = decks.find((d) => d.id === deckId)
      if (!deck) {
        setCards([])
        setPendingCards([])
        setPendingDrafts({})
        setFocusCard(null)
        return
      }

      const accepted: Flashcard[] = []
      const pending: Flashcard[] = []
      const drafts: Record<string, { question: string; answer: string }> = {}

      deck.flashcards.forEach((card) => {
        const status = getStoredStatus(card.id)
        if (status === "accepted") {
          accepted.push(card)
        } else if (status === "skipped") {
          // intentionally ignored
        } else {
          pending.push(card)
          drafts[card.id] = { question: card.question, answer: card.answer }
        }
      })

      setCards(accepted)
      setPendingCards(pending)
      setPendingDrafts(drafts)
      setFocusCard(null)
    },
    [decks, isMounted],
  )

  useEffect(() => {
    if (isMounted) {
      initialiseDeck(selectedDeckId || decks[0]?.id || "")
    }
  }, [selectedDeckId, decks, initialiseDeck, isMounted])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const selectedDeck = useMemo(() => decks.find((d) => d.id === selectedDeckId), [selectedDeckId, decks])
  const deckTags = useMemo(() => {
    const tagSet = new Set<string>()
    cards.forEach((card) => {
      card.tags.forEach((tag) => {
        if (!tag.startsWith("card:")) {
          tagSet.add(tag)
        }
      })
    })
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
  }, [cards])

  const filteredCards = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return cards.filter((card) => {
      if (difficultyFilter !== "all" && card.difficulty !== difficultyFilter) return false
      if (cardTypeFilter !== "all" && card.cardType !== cardTypeFilter) return false
      if (tagFilter !== "all" && !card.tags.includes(tagFilter)) return false
      if (search) {
        const haystack = `${card.title} ${card.question} ${card.answer}`.toLowerCase()
        if (!haystack.includes(search)) return false
      }
      return true
    })
  }, [cards, difficultyFilter, cardTypeFilter, tagFilter, searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [difficultyFilter, cardTypeFilter, tagFilter, searchTerm, selectedDeckId])

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / cardsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const visibleCards = useMemo(() => {
    const start = (currentPage - 1) * cardsPerPage
    return filteredCards.slice(start, start + cardsPerPage)
  }, [filteredCards, currentPage, cardsPerPage])

  const filteredCount = filteredCards.length
  const startRange = filteredCount === 0 ? 0 : (currentPage - 1) * cardsPerPage + 1
  const endRange = filteredCount === 0 ? 0 : Math.min(filteredCount, startRange + visibleCards.length - 1)
  const canGoPrev = currentPage > 1 && filteredCount > 0
  const canGoNext = currentPage < totalPages && filteredCount > 0

  useEffect(() => {
    if (!isReviewDialogOpen) {
      setActiveReviewCardId(null)
      return
    }
    setActiveReviewCardId(pendingCards[0]?.id ?? null)
  }, [isReviewDialogOpen, pendingCards])

  const activeReviewCard = useMemo(
    () => pendingCards.find((card) => card.id === activeReviewCardId) ?? null,
    [pendingCards, activeReviewCardId],
  )

  const activeReviewIndex = useMemo(
    () => (activeReviewCardId ? pendingCards.findIndex((card) => card.id === activeReviewCardId) : -1),
    [pendingCards, activeReviewCardId],
  )

  const activeReviewDraft = activeReviewCard
    ? pendingDrafts[activeReviewCard.id] ?? { question: activeReviewCard.question, answer: activeReviewCard.answer }
    : null

  useEffect(() => {
    setReviewShowFace("front")
  }, [activeReviewCardId])

  const acceptedCount = cards.length
  const pendingCount = pendingCards.length

  useEffect(() => {
    if (!focusCard) {
      setInspectorDraft(null)
      return
    }
    setInspectorDraft({
      question: focusCard.question ?? "",
      answer: focusCard.answer ?? "",
      keyPoints: focusCard.keyPoints.join("\n"),
      followUps: focusCard.followUpPrompts.join("\n"),
    })
  }, [focusCard])

  const hasInspectorChanges = useMemo(() => {
    if (!focusCard || !inspectorDraft) return false
    const baseQuestion = focusCard.question ?? ""
    const baseAnswer = focusCard.answer ?? ""
    const baseKeyPoints = focusCard.keyPoints.join("\n")
    const baseFollowUps = focusCard.followUpPrompts.join("\n")
    return (
      inspectorDraft.question !== baseQuestion ||
      inspectorDraft.answer !== baseAnswer ||
      inspectorDraft.keyPoints !== baseKeyPoints ||
      inspectorDraft.followUps !== baseFollowUps
    )
  }, [focusCard, inspectorDraft])

  const hasActiveFilters =
    difficultyFilter !== "all" || cardTypeFilter !== "all" || tagFilter !== "all" || searchTerm.trim().length > 0

  const handleDraftChange = useCallback((cardId: string, field: "question" | "answer", value: string) => {
    setPendingDrafts((prev) => ({
      ...prev,
      [cardId]: {
        question: field === "question" ? value : prev[cardId]?.question ?? "",
        answer: field === "answer" ? value : prev[cardId]?.answer ?? "",
      },
    }))
  }, [])

  const handleAcceptPending = useCallback(
    (cardId: string) => {
      const card = pendingCards.find((c) => c.id === cardId)
      if (!card) return
      const draft = pendingDrafts[cardId]
      const cleanedQuestion = draft?.question?.trim() ? draft.question.trim() : card.question
      const cleanedAnswer = draft?.answer?.trim() ? draft.answer.trim() : card.answer
      const currentIndex = pendingCards.findIndex((c) => c.id === cardId)
      const nextCardId =
        pendingCards[currentIndex + 1]?.id ?? pendingCards[currentIndex - 1]?.id ?? null

      const updatedCard: Flashcard = {
        ...card,
        question: cleanedQuestion,
        answer: cleanedAnswer,
      }

      setCards((prev) => [...prev, updatedCard])
      setPendingCards((prev) => prev.filter((c) => c.id !== cardId))
      setPendingDrafts((prev) => {
        const next = { ...prev }
        delete next[cardId]
        return next
      })
      setStoredStatus(cardId, "accepted")
      if (isReviewDialogOpen) {
        if (nextCardId) {
          setActiveReviewCardId(nextCardId)
        } else {
          setIsReviewDialogOpen(false)
        }
      }
    },
    [pendingCards, pendingDrafts, isReviewDialogOpen],
  )

  const handleSkipPending = useCallback((cardId: string) => {
    const currentIndex = pendingCards.findIndex((c) => c.id === cardId)
    const nextCardId =
      pendingCards[currentIndex + 1]?.id ?? pendingCards[currentIndex - 1]?.id ?? null
    setPendingCards((prev) => prev.filter((c) => c.id !== cardId))
    setPendingDrafts((prev) => {
      const next = { ...prev }
      delete next[cardId]
      return next
    })
    setStoredStatus(cardId, "skipped")
    if (isReviewDialogOpen) {
      if (nextCardId) {
        setActiveReviewCardId(nextCardId)
      } else {
        setIsReviewDialogOpen(false)
      }
    }
  }, [pendingCards, isReviewDialogOpen])

  const handleResetReview = useCallback(() => {
    if (!selectedDeck) return
    selectedDeck.flashcards.forEach((card) => setStoredStatus(card.id, "new"))
    const drafts: Record<string, { question: string; answer: string }> = {}
    const pending: Flashcard[] = []
    selectedDeck.flashcards.forEach((card) => {
      drafts[card.id] = { question: card.question, answer: card.answer }
      pending.push(card)
    })
    setPendingDrafts(drafts)
    setPendingCards(pending)
    setCards([])
    setFocusCard(null)
    setIsReviewDialogOpen(false)
  }, [selectedDeck])

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }, [])

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }, [totalPages])
  const handleClearFilters = useCallback(() => {
    setDifficultyFilter("all")
    setCardTypeFilter("all")
    setTagFilter("all")
    setSearchTerm("")
  }, [])

  const updateInspectorDraft = useCallback((field: keyof NonNullable<typeof inspectorDraft>, value: string) => {
    setInspectorDraft((prev) => (prev ? { ...prev, [field]: value } : prev))
  }, [])

  const handleInspectorReset = useCallback(() => {
    if (!focusCard) {
      setInspectorDraft(null)
      return
    }
    setInspectorDraft({
      question: focusCard.question ?? "",
      answer: focusCard.answer ?? "",
      keyPoints: focusCard.keyPoints.join("\n"),
      followUps: focusCard.followUpPrompts.join("\n"),
    })
  }, [focusCard])

  const handleInspectorSave = useCallback(() => {
    if (!focusCard || !inspectorDraft) return
    const parseMultiline = (value: string) =>
      value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

    const updatedCard: Flashcard = {
      ...focusCard,
      question: inspectorDraft.question.trim(),
      answer: inspectorDraft.answer.trim(),
      keyPoints: parseMultiline(inspectorDraft.keyPoints),
      followUpPrompts: parseMultiline(inspectorDraft.followUps),
    }

    setCards((prev) => prev.map((card) => (card.id === focusCard.id ? updatedCard : card)))
    setFocusCard(updatedCard)
    setInspectorDraft({
      question: updatedCard.question,
      answer: updatedCard.answer,
      keyPoints: updatedCard.keyPoints.join("\n"),
      followUps: updatedCard.followUpPrompts.join("\n"),
    })
  }, [focusCard, inspectorDraft])

  const handleSendCardBackToReview = useCallback(() => {
    if (!focusCard) return
    const cardId = focusCard.id
    const cardToRequeue = cards.find((card) => card.id === cardId)
    setCards((prev) => prev.filter((card) => card.id !== cardId))
    if (cardToRequeue) {
      setPendingCards((prev) => {
        if (prev.some((card) => card.id === cardId)) return prev
        return [cardToRequeue, ...prev]
      })
      setPendingDrafts((prev) => ({
        ...prev,
        [cardId]:
          prev[cardId] ?? {
            question: cardToRequeue.question,
            answer: cardToRequeue.answer,
          },
      }))
      setStoredStatus(cardId, "new")
    }
    setFocusCard(null)
    setInspectorDraft(null)
  }, [focusCard, cards])

  const goToReviewCard = useCallback(
    (index: number) => {
      if (index < 0 || index >= pendingCards.length) return
      const nextCard = pendingCards[index]
      if (!nextCard) return
      setActiveReviewCardId(nextCard.id)
    },
    [pendingCards],
  )

  const goToReviewPrev = useCallback(() => {
    if (activeReviewIndex <= 0) return
    goToReviewCard(activeReviewIndex - 1)
  }, [goToReviewCard, activeReviewIndex])

  const goToReviewNext = useCallback(() => {
    if (activeReviewIndex < 0 || activeReviewIndex >= pendingCards.length - 1) return
    goToReviewCard(activeReviewIndex + 1)
  }, [goToReviewCard, activeReviewIndex, pendingCards.length])

  const reviewOptions = useMemo(
    () =>
      pendingCards.map((card, index) => {
        const baseLabel = card.title || card.question || "Untitled card"
        const trimmed = baseLabel.length > 48 ? `${baseLabel.slice(0, 48)}…` : baseLabel
        return {
          id: card.id,
          label: `${index + 1}/${pendingCards.length} • ${trimmed}`,
        }
      }),
    [pendingCards],
  )

  const canReviewPrev = activeReviewIndex > 0
  const canReviewNext = activeReviewIndex >= 0 && activeReviewIndex < pendingCards.length - 1

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
    if (cards.length === 0) {
      alert("Approve at least one flashcard before exporting this deck.")
      return
    }
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
          acceptedIds: cards.map((card) => card.id),
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
    if (cards.length === 0) {
      setShareError("Approve at least one card before creating a share link.")
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
        body: JSON.stringify({ deckId: deck.id, acceptedIds: cards.map((card) => card.id) }),
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
              <Button
                className="gap-2 bg-indigo-500 text-white hover:bg-indigo-400"
                onClick={() => setIsReviewDialogOpen(true)}
                disabled={pendingCards.length === 0}
              >
                <Inbox className="h-4 w-4" />
                {pendingCards.length > 0 ? `Review ${pendingCards.length} new cards` : "Review queue empty"}
              </Button>
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
                disabled={isGeneratingShareLink || !selectedDeck || cards.length === 0}
              >
                {isGeneratingShareLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                Share deck
              </Button>
            </div>
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-[420px]">
            <StatCard label="Accepted cards" value={acceptedCount} />
            <StatCard label="Awaiting review" value={pendingCount} />
            <StatCard
              label={hasActiveFilters ? "Matching cards" : "Deck size"}
              value={
                hasActiveFilters
                  ? `${filteredCount}${filteredCount !== acceptedCount ? ` / ${acceptedCount}` : ""}`
                  : totalCards
              }
            />
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

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search cards"
                className="w-[220px] pl-9"
              />
            </div>
            <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as typeof difficultyFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All difficulties</SelectItem>
                <SelectItem value="foundation">Foundation</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="challenge">Challenge</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cardTypeFilter} onValueChange={(value) => setCardTypeFilter(value as typeof cardTypeFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Card type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="core">Core insights</SelectItem>
                <SelectItem value="detail">Deep dives</SelectItem>
                <SelectItem value="tag">Tag lenses</SelectItem>
              </SelectContent>
            </Select>
            {deckTags.length > 0 && (
              <Select value={tagFilter} onValueChange={(value) => setTagFilter(value as typeof tagFilter)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tag filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {deckTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasActiveFilters && (
              <Button variant="ghost" className="text-xs" onClick={handleClearFilters}>
                Clear filters
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            {filteredCount === 0 ? (
              <span>No cards to display</span>
            ) : (
              <span>
                {startRange}–{endRange} of {filteredCount}
                {filteredCount !== acceptedCount ? ` (${acceptedCount} total)` : ""}
              </span>
            )}
            <div className="inline-flex overflow-hidden rounded-full border border-slate-200">
              <Button variant="ghost" size="icon" className="rounded-none" onClick={goToPrevPage} disabled={!canGoPrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-xs text-slate-500">
                {filteredCount === 0 ? 0 : currentPage} / {filteredCount === 0 ? 0 : totalPages}
              </span>
              <Button variant="ghost" size="icon" className="rounded-none" onClick={goToNextPage} disabled={!canGoNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
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
              {acceptedCount === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300/70 bg-slate-50/70 p-10 text-center text-sm text-slate-500">
                  No flashcards available for this deck yet. Review and approve new cards to populate the workspace.
                </div>
              ) : filteredCount === 0 ? (
                <div className="rounded-2xl border border-dashed border-amber-300/70 bg-amber-50/70 p-10 text-center text-sm text-amber-600">
                  No cards match the current filters. Adjust your filters to see more of the deck.
                </div>
              ) : isMounted ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={visibleCards.map((card) => card.id)} strategy={rectSortingStrategy}>
                    <div className={cn(layoutClasses[layoutMode], "gap-6")}>
                      {visibleCards.map((card) => (
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
                  {visibleCards.map((card) => (
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
            {focusCard && inspectorDraft ? (
              <div className="flex flex-col gap-5 text-sm text-slate-700">
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-500">
                  <Badge variant="secondary" className="rounded-full bg-slate-900 text-white">
                    {focusCard.difficulty}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    {focusCard.cardType === "core"
                      ? "Core insight"
                      : focusCard.cardType === "detail"
                        ? "Deep dive"
                        : "Tag lens"}
                  </Badge>
                  {focusCard.tags
                    .filter((tag) => !tag.startsWith("card:"))
                    .map((tag) => (
                      <Badge key={tag} variant="outline" className="rounded-full">
                        {tag}
                      </Badge>
                    ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prompt</label>
                  <Textarea
                    value={inspectorDraft.question}
                    onChange={(event) => updateInspectorDraft("question", event.target.value)}
                    className="min-h-[110px] resize-y"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Answer</label>
                  <Textarea
                    value={inspectorDraft.answer}
                    onChange={(event) => updateInspectorDraft("answer", event.target.value)}
                    className="min-h-[110px] resize-y bg-emerald-50/60 text-emerald-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Key points (one per line)
                  </label>
                  <Textarea
                    value={inspectorDraft.keyPoints}
                    onChange={(event) => updateInspectorDraft("keyPoints", event.target.value)}
                    className="min-h-[110px] resize-y"
                    placeholder="Add supporting bullets, one per line."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reflection prompts (one per line)
                  </label>
                  <Textarea
                    value={inspectorDraft.followUps}
                    onChange={(event) => updateInspectorDraft("followUps", event.target.value)}
                    className="min-h-[110px] resize-y"
                    placeholder="Add follow-up prompts, one per line."
                  />
                </div>

                {focusCard.source?.url && (
                  <div className="space-y-1 text-xs">
                    <p className="uppercase tracking-wide text-slate-500">Source</p>
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

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleInspectorSave} disabled={!hasInspectorChanges} className="bg-slate-900 text-white">
                    Save changes
                  </Button>
                  <Button variant="outline" onClick={handleInspectorReset} disabled={!hasInspectorChanges}>
                    Reset
                  </Button>
                  <Button variant="ghost" className="gap-2 text-slate-500 hover:text-slate-900" onClick={handleSendCardBackToReview}>
                    <RotateCcw className="h-4 w-4" />
                    Send back to review
                  </Button>
                </div>
                {!hasInspectorChanges && (
                  <p className="text-xs text-slate-400">
                    Tip: edits save locally for this deck. Approved cards will use the updated wording in exports and share
                    links.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Select a card on the canvas to inspect and edit details.
              </div>
            )}
          </ScrollArea>
        </div>
      </section>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="flex w-[95vw] max-h-[90vh] flex-col overflow-hidden border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[1100px]">
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900">Review new flashcards</DialogTitle>
                <DialogDescription>
                  Refine wording, accept the cards you want in your deck, or skip the ones that don’t fit.
                </DialogDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleResetReview} disabled={pendingCount === 0}>
                Reset queue
              </Button>
            </div>
          </DialogHeader>
          {pendingCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 pb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={goToReviewPrev}
                  disabled={!canReviewPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={goToReviewNext}
                  disabled={!canReviewNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {reviewOptions.length > 0 && (
                <Select
                  value={activeReviewCardId ?? reviewOptions[0]?.id ?? ""}
                  onValueChange={(value) => {
                    const next = pendingCards.find((card) => card.id === value)
                    if (next) setActiveReviewCardId(next.id)
                  }}
                >
                  <SelectTrigger className="w-[320px] text-left">
                    <SelectValue placeholder="Select card to review" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[320px]">
                    {reviewOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-6 px-6 pb-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            {activeReviewCard ? (
              <>
                <div className="space-y-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                    <span>
                      Card {pendingCards.findIndex((card) => card.id === activeReviewCard.id) + 1} of {pendingCount}
                    </span>
                    <Tabs value={reviewShowFace} onValueChange={(value) => setReviewShowFace(value as typeof reviewShowFace)}>
                      <TabsList>
                        <TabsTrigger value="front">Prompt</TabsTrigger>
                        <TabsTrigger value="back">Answer</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <FlashcardCard
                      card={activeReviewCard}
                      showBack={reviewShowFace === "back"}
                      theme={theme as any}
                      size={cardSize}
                      font={fontFamily}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prompt</label>
                      <Textarea
                        value={activeReviewDraft?.question ?? ""}
                        onChange={(event) =>
                          activeReviewCard && handleDraftChange(activeReviewCard.id, "question", event.target.value)
                        }
                        className="min-h-[120px] resize-y"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Answer</label>
                      <Textarea
                        value={activeReviewDraft?.answer ?? ""}
                        onChange={(event) =>
                          activeReviewCard && handleDraftChange(activeReviewCard.id, "answer", event.target.value)
                        }
                        className="min-h-[120px] resize-y"
                      />
                    </div>
                  </div>
                  {activeReviewCard.keyPoints.length > 0 && (
                    <div className="rounded-xl bg-slate-100/80 p-4 text-xs text-slate-600">
                      <p className="font-semibold uppercase tracking-wide text-slate-500">Key points</p>
                      <ul className="mt-2 space-y-1">
                        {activeReviewCard.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
                      onClick={() => activeReviewCard && handleAcceptPending(activeReviewCard.id)}
                    >
                      Approve & add to deck
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => activeReviewCard && handleSkipPending(activeReviewCard.id)}
                    >
                      Skip this card
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-xs uppercase tracking-wide text-slate-500"
                      onClick={() => setIsReviewDialogOpen(false)}
                    >
                      Close review
                    </Button>
                  </div>
                </div>
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Insight</p>
                    <p className="font-semibold text-slate-900">{activeReviewCard.insightTitle}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="rounded-full text-xs capitalize">
                        {activeReviewCard.cardType === "core"
                          ? "Core insight"
                          : activeReviewCard.cardType === "detail"
                            ? "Deep dive"
                            : "Tag lens"}
                      </Badge>
                      <Badge variant="outline" className="rounded-full text-xs capitalize">
                        {activeReviewCard.difficulty}
                      </Badge>
                    </div>
                  </div>
                  {activeReviewCard.followUpPrompts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Reflection prompts</p>
                      <ul className="space-y-1 rounded-xl bg-slate-50 p-3">
                        {activeReviewCard.followUpPrompts.map((prompt, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span>?</span>
                            <span>{prompt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {activeReviewCard.tags
                        .filter((tag) => !tag.startsWith("card:"))
                        .map((tag) => (
                          <Badge key={tag} variant="secondary" className="rounded-full bg-slate-100 text-slate-600">
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  {activeReviewCard.source?.url && (
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Source</p>
                      <a
                        href={activeReviewCard.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                      >
                        {activeReviewCard.source.title ?? activeReviewCard.source.url}
                      </a>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                All caught up! New cards will appear here as you capture more insights.
              </div>
            )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              flashcards={cards}
              onExit={() => setIsStudyOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
