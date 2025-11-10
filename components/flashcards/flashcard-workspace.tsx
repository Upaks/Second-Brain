"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode, type CSSProperties } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Inbox,
  Loader2,
  RotateCcw,
  Rows2,
  Rows3,
  Rows,
  Search,
  Share2,
  Wand2,
  Plus,
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

type LayoutMode = "grid" | "stack" | "storyboard"

const layoutClasses: Record<LayoutMode, string> = {
  grid: "grid auto-rows-max gap-8",
  stack: "flex flex-col gap-6",
  storyboard: "grid auto-rows-[minmax(240px,auto)] gap-8",
}

const ZOOM_LEVELS = [60, 80, 100, 120, 150] as const

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

function ControlColumn({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-800 bg-slate-900/80 p-4", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-3 space-y-3 text-slate-200">{children}</div>
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
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
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
  const [zoomIndex, setZoomIndex] = useState(() => {
    const defaultIndex = ZOOM_LEVELS.findIndex((value) => value === 100)
    return defaultIndex >= 0 ? defaultIndex : 2
  })
  const [rightPanelTab, setRightPanelTab] = useState<"deck" | "style" | "edit">("deck")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)")
    if (media.matches) {
      setIsRightPanelOpen(false)
    }

    function handleChange(event: MediaQueryListEvent) {
      if (event.matches) {
        setIsRightPanelOpen(false)
      }
    }

    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
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

  const acceptedCount = cards.length
  const pendingCount = pendingCards.length
  const zoom = ZOOM_LEVELS[zoomIndex] ?? 100
  const boardScale = zoom / 100
  const boardTransformStyle = useMemo<CSSProperties>(() => {
    const widthPercent = boardScale === 0 ? 100 : 100 / boardScale
    return {
      transform: `scale(${boardScale})`,
      transformOrigin: "0% 0%",
      width: `${widthPercent}%`,
    }
  }, [boardScale])
  const baseColumnWidth = useMemo(() => {
    const sizeBase = cardSize === "sm" ? 280 : cardSize === "lg" ? 360 : 320
    if (layoutMode === "storyboard") {
      return sizeBase + 40
    }
    return sizeBase
  }, [cardSize, layoutMode])
  const lastAdded = useMemo(() => {
    const timestamp = cards[0]?.createdAt
    if (!timestamp) return "—"
    return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  }, [cards])

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

  const handleZoomOutControl = useCallback(() => {
    setZoomIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const handleZoomInControl = useCallback(() => {
    setZoomIndex((prev) => Math.min(ZOOM_LEVELS.length - 1, prev + 1))
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

  useEffect(() => {
    if (!isReviewDialogOpen) {
      setActiveReviewCardId(null)
      return
    }
    setActiveReviewCardId((current) => {
      if (current && pendingCards.some((card) => card.id === current)) return current
      return pendingCards[0]?.id ?? null
    })
  }, [isReviewDialogOpen, pendingCards])

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

  const RightPanel = ({
    className,
    scrollClassName,
  }: {
    className?: string
    scrollClassName?: string
  }) => (
    <Tabs
      value={rightPanelTab}
      onValueChange={(value) => setRightPanelTab(value as typeof rightPanelTab)}
      className={cn("flex flex-col bg-slate-950/95", className)}
    >
      <div className="px-5 pt-5">
        <TabsList className="grid w-full grid-cols-3 rounded-xl border border-slate-800 bg-slate-900/80">
          <TabsTrigger
            value="deck"
            className="px-3 py-2 text-xs text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white"
          >
            Deck
          </TabsTrigger>
          <TabsTrigger
            value="style"
            className="px-3 py-2 text-xs text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white"
          >
            Style
          </TabsTrigger>
          <TabsTrigger
            value="edit"
            className="px-3 py-2 text-xs text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white"
          >
            Edit
          </TabsTrigger>
        </TabsList>
      </div>
      <ScrollArea className={cn("flex-1 px-5 pb-6", scrollClassName)}>
        <TabsContent value="deck" className="space-y-5 pt-4">
          <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Deck</p>
            <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
              <SelectTrigger className="w-full rounded-lg border border-slate-800 bg-slate-950/70 text-left text-slate-100">
                <SelectValue placeholder="Select a deck" />
              </SelectTrigger>
              <SelectContent className="border-slate-800 bg-slate-900 text-slate-100">
                {decks.map((deck) => (
                  <SelectItem key={deck.id} value={deck.id}>
                    {deck.name} ({deck.flashcards.length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">{deckDescription}</p>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Stats</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-200">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Accepted</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{acceptedCount}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Pending</p>
                <p className="mt-1 text-lg font-semibold text-amber-300">{pendingCount}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Generated</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{totalCards}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Last added</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{lastAdded}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Filters</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search cards"
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950/70 pl-9 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <div className="grid gap-2">
              <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as typeof difficultyFilter)}>
                <SelectTrigger className="w-full rounded-lg border border-slate-800 bg-slate-950/70 text-left text-slate-100">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900 text-slate-100">
                  <SelectItem value="all">All difficulties</SelectItem>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="challenge">Challenge</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cardTypeFilter} onValueChange={(value) => setCardTypeFilter(value as typeof cardTypeFilter)}>
                <SelectTrigger className="w-full rounded-lg border border-slate-800 bg-slate-950/70 text-left text-slate-100">
                  <SelectValue placeholder="Card type" />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900 text-slate-100">
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="core">Core insights</SelectItem>
                  <SelectItem value="detail">Deep dives</SelectItem>
                  <SelectItem value="tag">Tag lenses</SelectItem>
                </SelectContent>
              </Select>
              {deckTags.length > 0 && (
                <Select value={tagFilter} onValueChange={(value) => setTagFilter(value as typeof tagFilter)}>
                  <SelectTrigger className="w-full rounded-lg border border-slate-800 bg-slate-950/70 text-left text-slate-100">
                    <SelectValue placeholder="Tag filter" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-800 bg-slate-900 text-slate-100">
                    <SelectItem value="all">All tags</SelectItem>
                    {deckTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                className="w-full border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                onClick={handleClearFilters}
              >
                Clear filters
              </Button>
            )}
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Viewing {filteredCount === 0 ? 0 : startRange}–{filteredCount === 0 ? 0 : endRange} of {filteredCount}
            </p>
          </section>
        </TabsContent>

        <TabsContent value="style" className="space-y-5 pt-4">
          <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Board background</p>
            <div className="grid grid-cols-2 gap-3">
              {boardBackgrounds.map((option) => (
                <Button
                  key={option.id}
                  variant={boardBackground === option.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBoardBackground(option.id)}
                  className="h-16 flex-col items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-left text-slate-100"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{option.label}</span>
                  <span className={cn("h-7 w-7 rounded-full border border-white/20", option.className)} />
                </Button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Card theme</p>
            <div className="flex flex-wrap gap-2">
              {cardThemes.map((option) => (
                <Button
                  key={option.id}
                  variant={theme === option.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme(option.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 transition-all hover:border-slate-500"
                >
                  <span className={cn("h-7 w-7 rounded-full border border-white/20", option.swatch)} />
                </Button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Card size</p>
            <div className="flex flex-wrap gap-2">
              {cardSizes.map((option) => (
                <Button
                  key={option.id}
                  variant={cardSize === option.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCardSize(option.id)}
                  className="rounded-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 capitalize"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Typeface</p>
            <div className="flex flex-wrap gap-2">
              {fonts.map((option) => (
                <Button
                  key={option.id}
                  variant={fontFamily === option.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFontFamily(option.id)}
                  className="rounded-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 capitalize"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Layout</p>
            <div className="flex flex-wrap gap-2">
              {([
                { id: "grid", icon: Rows3, label: "Grid" },
                { id: "stack", icon: Rows, label: "Stack" },
                { id: "storyboard", icon: Rows2, label: "Storyboard" },
              ] as const).map((option) => (
                <Button
                  key={option.id}
                  variant={layoutMode === option.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLayoutMode(option.id)}
                  className="gap-2 rounded-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                >
                  <option.icon className="h-4 w-4" />
                  {option.label}
                </Button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Canvas mood</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "neutral", label: "Neutral", className: "bg-slate-100/40" },
                { id: "focus", label: "Focus", className: "bg-indigo-500/20" },
                { id: "warm", label: "Warm", className: "bg-amber-400/20" },
                { id: "energy", label: "Energy", className: "bg-emerald-400/20" },
              ].map((option) => (
                <Button
                  key={option.id}
                  variant={boardBackground === option.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBoardBackground(option.id)}
                  className="h-16 flex-col items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-left text-slate-100"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{option.label}</span>
                  <span className={cn("h-7 w-7 rounded-full border border-white/20", option.className)} />
                </Button>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="edit" className="space-y-5 pt-4">
          <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Selected card</p>
            {focusCard ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="rounded-full bg-slate-900 text-white">
                    {focusCard.cardType}
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{focusCard.difficulty ?? "unrated"}</span>
                    <span>•</span>
                    <span>{focusCard.tags.join(", ") || "No tags"}</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-slate-200">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Question</p>
                    <Textarea
                      value={pendingDrafts[focusCard.id]?.question ?? focusCard.question}
                      onChange={(event) =>
                        setPendingDrafts((prev) => ({
                          ...prev,
                          [focusCard.id]: {
                            question: event.target.value,
                            answer: pendingDrafts[focusCard.id]?.answer ?? focusCard.answer,
                          },
                        }))
                      }
                      className="min-h-[110px] resize-y rounded-lg border border-slate-800 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-slate-600 focus:ring-slate-600"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Answer</p>
                    <Textarea
                      value={pendingDrafts[focusCard.id]?.answer ?? focusCard.answer}
                      onChange={(event) =>
                        setPendingDrafts((prev) => ({
                          ...prev,
                          [focusCard.id]: {
                            question: pendingDrafts[focusCard.id]?.question ?? focusCard.question,
                            answer: event.target.value,
                          },
                        }))
                      }
                      className="min-h-[110px] resize-y rounded-lg border border-emerald-500/60 bg-emerald-950/50 text-emerald-100 placeholder:text-emerald-300/70 focus:border-emerald-400 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Key points</p>
                    <Textarea
                      value={(focusCard.keyPoints ?? []).join("\n")}
                      onChange={(event) => {
                        const nextValue = event.target.value
                        setCards((prev) =>
                          prev.map((card) =>
                            card.id === focusCard.id ? { ...card, keyPoints: nextValue.split(/\n+/).filter(Boolean) } : card,
                          ),
                        )
                      }}
                      className="min-h-[110px] resize-y rounded-lg border border-slate-800 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-slate-600 focus:ring-slate-600"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Reflection prompt</p>
                    <Textarea
                      value={focusCard.followUpPrompts.join("\n")}
                      onChange={(event) => {
                        const nextValue = event.target.value
                        setCards((prev) =>
                          prev.map((card) =>
                            card.id === focusCard.id
                              ? { ...card, followUpPrompts: nextValue.split(/\n+/).filter(Boolean) }
                              : card,
                          ),
                        )
                      }}
                      className="min-h-[110px] resize-y rounded-lg border border-slate-800 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-slate-600 focus:ring-slate-600"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button className="gap-2 bg-amber-500 text-slate-900 hover:bg-amber-400" onClick={handleSendCardBackToReview}>
                    <RotateCcw className="h-4 w-4" />
                    Send back to review
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setFocusCard(null)}
                    className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
                Select a card to view its details here.
              </div>
            )}
          </section>
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden border border-slate-900 bg-slate-950 text-slate-100 shadow-2xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 bg-slate-950 px-6 py-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <h1 className="text-lg font-semibold text-white">{deckName}</h1>
              <p className="text-xs text-slate-400">
                {acceptedCount} accepted • {pendingCount} pending • {totalCards} generated
              </p>
            </div>
            <div className="hidden items-center gap-2 text-xs text-slate-400 md:flex">
              <span className="uppercase tracking-wide">Zoom</span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                onClick={handleZoomOutControl}
                disabled={zoomIndex === 0}
              >
                –
              </Button>
              <span className="w-12 text-center font-mono text-sm text-slate-200">{zoom}%</span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                onClick={handleZoomInControl}
                disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              >
                +
              </Button>
            </div>
            <Tabs
              value={showFace}
              onValueChange={(value) => setShowFace(value as "front" | "back")}
              className="hidden md:block"
            >
              <TabsList className="grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-900/80">
                <TabsTrigger
                  value="front"
                  className="px-3 py-1 text-xs text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                >
                  Front
                </TabsTrigger>
                <TabsTrigger
                  value="back"
                  className="px-3 py-1 text-xs text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                >
                  Back
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="gap-2 bg-indigo-500 text-white hover:bg-indigo-400"
              onClick={() => setIsReviewDialogOpen(true)}
              disabled={pendingCards.length === 0}
            >
              <Inbox className="h-4 w-4" />
              {pendingCards.length > 0 ? `Review ${pendingCards.length} cards` : "Review queue empty"}
            </Button>
            <Button className="gap-2 bg-slate-800 text-white hover:bg-slate-700" onClick={() => setIsStudyOpen(true)}>
              <Wand2 className="h-4 w-4" />
              Study
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 border-slate-800 bg-slate-900 text-slate-100">
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
              className="gap-2 text-slate-200 hover:bg-slate-800"
              onClick={handleShareDeck}
              disabled={isGeneratingShareLink || !selectedDeck || cards.length === 0}
            >
              {isGeneratingShareLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              Share
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 xl:hidden"
              onClick={() => setIsRightPanelOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Panel
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden xl:flex-row">
          <div className="relative flex flex-1 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(51,65,85,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(51,65,85,0.22)_1px,transparent_1px)] bg-[size:48px_48px]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.22),_transparent_60%)]" />
            <div className="relative flex-1 overflow-auto px-4 py-8 pb-24 sm:px-6 lg:px-9 xl:px-12">
              <div className="w-full pb-6">
                <div className="origin-top-left transition-transform duration-150" style={boardTransformStyle}>
                  {acceptedCount === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/70 p-10 text-center text-sm text-slate-300">
                      No flashcards available for this deck yet. Review and approve new cards to populate the workspace.
                    </div>
                  ) : filteredCount === 0 ? (
                    <div className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-950/40 p-10 text-center text-sm text-amber-200">
                      No cards match the current filters. Adjust your filters to see more of the deck.
                    </div>
                  ) : isMounted ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                      <SortableContext items={visibleCards.map((card) => card.id)} strategy={rectSortingStrategy}>
                        <div
                          className={cn(layoutClasses[layoutMode])}
                          style=
                            {layoutMode === "grid" || layoutMode === "storyboard"
                              ? { gridTemplateColumns: `repeat(auto-fit, minmax(${Math.round(baseColumnWidth)}px, 1fr))` }
                              : undefined}
                        >
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
                    <div
                      className={cn(layoutClasses[layoutMode])}
                      style=
                        {layoutMode === "grid" || layoutMode === "storyboard"
                          ? { gridTemplateColumns: `repeat(auto-fit, minmax(${Math.round(baseColumnWidth)}px, 1fr))` }
                          : undefined}
                    >
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
          </div>

          <div className="hidden xl:flex xl:w-[340px] xl:flex-shrink-0">
            <RightPanel className="h-full w-full border-l border-slate-900" scrollClassName="h-full overflow-hidden" />
          </div>
        </div>
      </div>

      <Sheet open={isRightPanelOpen} onOpenChange={setIsRightPanelOpen}>
        <SheetContent side="right" className="w-full max-w-md border-l border-slate-900 bg-slate-950 p-0 text-slate-100">
          <SheetHeader className="sr-only">
            <SheetTitle>Workspace controls</SheetTitle>
          </SheetHeader>
          <RightPanel className="h-full w-full" scrollClassName="h-full" />
        </SheetContent>
      </Sheet>

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
                      className="gap-2 border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
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
    </>
  )
}
