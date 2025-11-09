"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import type { FlashcardDeckData } from "@/lib/flashcards-server"
import { FlashcardCard } from "@/components/flashcards/flashcard-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Share2 } from "lucide-react"

interface ShareDeckClientProps {
  deck: FlashcardDeckData
}

export function ShareDeckClient({ deck }: ShareDeckClientProps) {
  const [showFace, setShowFace] = useState<"front" | "back">("front")

  const cardCountLabel = useMemo(() => {
    const count = deck.flashcards.length
    return `${count} flashcard${count === 1 ? "" : "s"}`
  }, [deck.flashcards.length])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-600/30 via-slate-900/50 to-slate-950/90 p-8 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.65)]">
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
            <Button asChild variant="ghost" className="text-white/80 hover:bg-white/10">
              <Link href="/auth/signup">
                <Share2 className="mr-2 h-4 w-4" />
                Save this deck
              </Link>
            </Button>
            <Tabs value={showFace} onValueChange={(value) => setShowFace(value as "front" | "back")}
              className="rounded-full bg-white/10 p-1">
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

        <main className="flex flex-1 flex-col gap-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-inner">
          <Card className="border-0 bg-transparent">
            <ScrollArea className="h-full w-full">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {deck.flashcards.map((card) => (
                  <FlashcardCard key={card.id} card={card} showBack={showFace === "back"} theme="default" size="md" />
                ))}
              </div>
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
