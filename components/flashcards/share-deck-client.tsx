"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import type { FlashcardDeckData } from "@/lib/flashcards-server"
import { FlashcardCard } from "@/components/flashcards/flashcard-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { AlertCircle, ArrowLeft, Check, Filter, Link2, Search, Share2 } from "lucide-react"

interface ShareDeckClientProps {
  deck: FlashcardDeckData
}

export function ShareDeckClient({ deck }: ShareDeckClientProps) {
  const [showFace, setShowFace] = useState<"front" | "back">("front")
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "foundation" | "intermediate" | "challenge">("all")
  const [cardTypeFilter, setCardTypeFilter] = useState<"all" | "core" | "detail" | "tag">("all")
  const [tagFilter, setTagFilter] = useState<string | "all">("all")
  const [shareUrl] = useState(() => (typeof window !== "undefined" ? window.location.href : ""))
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle")

  const cardCountLabel = useMemo(() => {
    const count = deck.flashcards.length
    return `${count} flashcard${count === 1 ? "" : "s"}`
  }, [deck.flashcards.length])

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    deck.flashcards.forEach((card) => {
      card.tags
        .filter((tag) => !tag.startsWith("card:"))
        .forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet.values()).sort((a, b) => a.localeCompare(b))
  }, [deck.flashcards])

  const filteredCards = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return deck.flashcards.filter((card) => {
      if (difficultyFilter !== "all" && card.difficulty !== difficultyFilter) return false
      if (cardTypeFilter !== "all" && card.cardType !== cardTypeFilter) return false
      if (tagFilter !== "all" && !card.tags.includes(tagFilter)) return false
      if (term) {
        const haystack = `${card.title} ${card.question} ${card.answer}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [deck.flashcards, searchTerm, difficultyFilter, cardTypeFilter, tagFilter])

  const handleCopyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyState("copied")
      setTimeout(() => setCopyState("idle"), 2000)
    } catch (error) {
      console.error("[share-deck] copy error", error)
      setCopyState("error")
      setTimeout(() => setCopyState("idle"), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="space-y-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-600/25 via-slate-900/60 to-slate-950/90 p-8 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.65)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="secondary" className="bg-white/10 text-white/80">
                Shared flashcard deck
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{deck.name}</h1>
              <p className="max-w-2xl text-sm text-slate-200/80">
                Browse this deck in read-only mode. Add it to your own workspace to remix, rearrange, or study with
                progress tracking.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200/80">
              <Badge variant="secondary" className="bg-white/10 text-white/80">
                {cardCountLabel}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="border-white/20 bg-white/10 text-white/80 hover:bg-white/20"
              >
                {copyState === "copied" ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />Copied
                  </>
                ) : copyState === "error" ? (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />Retry copy
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />Copy link
                  </>
                )}
              </Button>
              <Button asChild variant="ghost" className="text-white/80 hover:bg-white/10">
                <Link href="/auth/signup">
                  <Share2 className="mr-2 h-4 w-4" />
                  Save this deck
                </Link>
              </Button>
            </div>
            <Tabs
              value={showFace}
              onValueChange={(value) => setShowFace(value as "front" | "back")}
              className="rounded-full bg-white/10 p-1"
            >
              <TabsList className="h-auto rounded-full bg-transparent">
                <TabsTrigger
                  value="front"
                  className="rounded-full px-4 py-1 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900"
                >
                  Front view
                </TabsTrigger>
                <TabsTrigger
                  value="back"
                  className="rounded-full px-4 py-1 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900"
                >
                  Back view
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-inner">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 shadow-inner">
                <Search className="h-4 w-4 text-slate-400" />
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search prompt or answer"
                  className="h-8 border-0 bg-transparent text-sm text-slate-100 focus-visible:ring-0"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <Filter className="h-4 w-4" />
                <span>{filteredCards.length} results</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
              <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-wide text-slate-400">Difficulty</span>
                <div className="flex flex-wrap gap-2">
                  {["all", "foundation", "intermediate", "challenge"].map((value) => (
                    <Button
                      key={value}
                      variant={difficultyFilter === value ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "rounded-full border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800",
                        difficultyFilter === value && "bg-indigo-500 text-white hover:bg-indigo-400",
                      )}
                      onClick={() => setDifficultyFilter(value as typeof difficultyFilter)}
                    >
                      {value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-wide text-slate-400">Card type</span>
                <div className="flex flex-wrap gap-2">
                  {["all", "core", "detail", "tag"].map((value) => (
                    <Button
                      key={value}
                      variant={cardTypeFilter === value ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "rounded-full border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800",
                        cardTypeFilter === value && "bg-indigo-500 text-white hover:bg-indigo-400",
                      )}
                      onClick={() => setCardTypeFilter(value as typeof cardTypeFilter)}
                    >
                      {value === "all" ? "All" : value === "core" ? "Core" : value === "detail" ? "Deep dive" : "Tag lens"}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-wide text-slate-400">Topic tag</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={tagFilter === "all" ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "rounded-full border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800",
                      tagFilter === "all" && "bg-indigo-500 text-white hover:bg-indigo-400",
                    )}
                    onClick={() => setTagFilter("all")}
                  >
                    All topics
                  </Button>
                  {availableTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={tagFilter === tag ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "rounded-full border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800",
                        tagFilter === tag && "bg-indigo-500 text-white hover:bg-indigo-400",
                      )}
                      onClick={() => setTagFilter(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Card className="border-0 bg-transparent">
            <ScrollArea className="h-full w-full">
              {filteredCards.length === 0 ? (
                <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/60 text-sm text-slate-400">
                  No flashcards match the current filters. Try adjusting the search or filter selections.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredCards.map((card) => (
                    <FlashcardCard key={card.id} card={card} showBack={showFace === "back"} theme="default" size="md" />
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-3 w-3" />
              Want to build your own? <Link href="/auth/signup" className="text-white underline">Create an account</Link>
            </div>
            <span>Deck generated from user insights · Read-only preview</span>
          </div>
        </main>
      </div>
    </div>
  )
}
