"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Flashcard } from "@/lib/flashcards"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowRight, RefreshCcw, Sparkles } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface StudySessionProps {
  deckName: string
  flashcards: Flashcard[]
  onExit?: () => void
}

type ReviewRating = "again" | "hard" | "good" | "easy"

type GoalMode = "cards" | "minutes"

interface StudyGoal {
  mode: GoalMode
  amount: number
}

const GOAL_STORAGE_KEY = "sb-study-goal"
const DEFAULT_GOAL: StudyGoal = { mode: "cards", amount: 10 }

function nextDifficulty(score: number, rating: ReviewRating) {
  switch (rating) {
    case "again":
      return Math.max(score - 0.4, -2)
    case "hard":
      return Math.max(score - 0.2, -1)
    case "good":
      return Math.min(score + 0.2, 2)
    case "easy":
      return Math.min(score + 0.4, 3)
    default:
      return score
  }
}

function ratingColor(rating: ReviewRating) {
  return {
    again: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
    hard: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    good: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    easy: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  }[rating]
}

function difficultyLabel(score: number) {
  if (score <= -1.5) return "Struggle"
  if (score <= -0.5) return "Needs review"
  if (score <= 0.5) return "Solid"
  if (score <= 1.5) return "Strong"
  return "Mastered"
}

export function StudySession({ deckName, flashcards, onExit }: StudySessionProps) {
  const [index, setIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [ratingHistory, setRatingHistory] = useState<Record<string, ReviewRating[]>>({})
  const [scores, setScores] = useState<Record<string, number>>({})
  const [goal, setGoal] = useState<StudyGoal>(DEFAULT_GOAL)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerStartRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(GOAL_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<StudyGoal>
        if (parsed && (parsed.mode === "cards" || parsed.mode === "minutes") && typeof parsed.amount === "number") {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setGoal({ mode: parsed.mode, amount: Math.max(1, Math.round(parsed.amount)) })
        }
      } catch (error) {
        console.warn("[flashcards] failed to parse stored study goal", error)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(goal))
  }, [goal])

  useEffect(() => {
    timerStartRef.current = Date.now()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setElapsedSeconds(0)
    const interval = window.setInterval(() => {
      if (!timerStartRef.current) return
      const diff = Math.floor((Date.now() - timerStartRef.current) / 1000)
      setElapsedSeconds(diff)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [])

  const totalCards = flashcards.length
  const safeIndex = totalCards > 0 ? Math.min(index, totalCards - 1) : 0
  const card = flashcards[safeIndex]

  const aggregatedStats = useMemo(() => {
    const counts: Record<ReviewRating, number> = {
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
    }
    Object.values(ratingHistory).forEach((ratings) => {
      ratings.forEach((rating) => {
        counts[rating] += 1
      })
    })
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0)
    const mastery = total === 0 ? 0 : Math.round(((counts.good + counts.easy * 1.2) / total) * 100)
    return { counts, total, mastery }
  }, [ratingHistory])

  const reviewedCount = aggregatedStats.total
  const elapsedMinutes = elapsedSeconds / 60
  const goalAmount = Math.max(goal.amount, 1)
  const cardsProgress = Math.min(reviewedCount / goalAmount, 1)
  const minutesProgress = Math.min(elapsedMinutes / goalAmount, 1)
  const progressValue = Math.round((goal.mode === "cards" ? cardsProgress : minutesProgress) * 100)
  const goalReached = progressValue >= 100
  const remaining = goal.mode === "cards"
    ? Math.max(goalAmount - reviewedCount, 0)
    : Math.max(goalAmount - elapsedMinutes, 0)

  const quickOptions = goal.mode === "cards" ? [5, 10, 15] : [5, 10, 20]

  if (!card) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <h2 className="text-xl font-semibold">No flashcards ready</h2>
        <p className="text-sm text-muted-foreground">Add insights to this deck before starting a study session.</p>
        {onExit && (
          <Button onClick={onExit} size="sm" variant="secondary">
            Close
          </Button>
        )}
      </div>
    )
  }

  function setGoalMode(mode: GoalMode) {
    setGoal((prev) => ({ mode, amount: mode === prev.mode ? prev.amount : mode === "cards" ? 10 : 10 }))
  }

  function handleFlip() {
    setShowBack((prev) => !prev)
  }

  function handleNext() {
    setIndex((prev) => Math.min(prev + 1, flashcards.length - 1))
    setShowBack(false)
  }

  function handlePrev() {
    setIndex((prev) => Math.max(prev - 1, 0))
    setShowBack(false)
  }

  function handleRating(rating: ReviewRating) {
    const cardId = card.id
    setRatingHistory((prev) => ({
      ...prev,
      [cardId]: [...(prev[cardId] ?? []), rating],
    }))
    setScores((prev) => ({
      ...prev,
      [cardId]: nextDifficulty(prev[cardId] ?? 0, rating),
    }))
    handleNext()
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className={cn("border border-primary/30 bg-primary/5 p-4", goalReached && "border-primary/60")}
        data-slot="study-goal">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-primary">Daily review goal</p>
            <h3 className="text-lg font-semibold">
              {goal.mode === "cards" ? `Review ${goalAmount} cards` : `Stay focused for ${goalAmount} minutes`}
            </h3>
            <p className="text-xs text-muted-foreground">
              {goal.mode === "cards"
                ? `${Math.min(reviewedCount, goalAmount)} / ${goalAmount} cards reviewed`
                : `${Math.min(elapsedMinutes, goalAmount).toFixed(1)} / ${goalAmount} minutes logged`}
              {goalReached && <span className="ml-2 text-primary font-semibold">Goal reached 🎉</span>}
            </p>
            {!goalReached && (
              <p className="text-xs text-muted-foreground">
                {goal.mode === "cards"
                  ? `${remaining} card${Math.round(remaining) === 1 ? "" : "s"} to go`
                  : `${remaining.toFixed(1)} minute${remaining <= 1.5 ? "" : "s"} remaining`}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={goal.mode === "cards" ? "default" : "outline"}
                onClick={() => setGoalMode("cards")}
              >
                Cards
              </Button>
              <Button
                size="sm"
                variant={goal.mode === "minutes" ? "default" : "outline"}
                onClick={() => setGoalMode("minutes")}
              >
                Minutes
              </Button>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {quickOptions.map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={goal.amount === value ? "secondary" : "outline"}
                  onClick={() => setGoal((prev) => ({ ...prev, amount: value }))}
                >
                  {value} {goal.mode === "cards" ? "cards" : "min"}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <Progress value={progressValue} className="mt-4" />
      </Card>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold leading-tight">Study session</h2>
            <Badge variant="secondary">{deckName}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              Card {safeIndex + 1} of {flashcards.length}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
                aggregatedStats.mastery >= 75
                  ? "border-emerald-300 text-emerald-600"
                  : aggregatedStats.mastery >= 50
                    ? "border-amber-300 text-amber-600"
                    : "border-slate-300 text-slate-500",
              )}
            >
              <Sparkles className="h-3 w-3" />
              Mastery {aggregatedStats.mastery}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {(["again", "hard", "good", "easy"] as ReviewRating[]).map((rating) => (
            <span key={rating} className="flex items-center gap-1">
              <span className={cn("inline-flex h-2 w-2 rounded-full", ratingColor(rating))} />
              {ratingHistory && aggregatedStats.counts[rating]}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <Card className="rounded-3xl p-8 shadow-lg">
          <div className="flex flex-col h-full justify-between gap-6">
            <div onClick={handleFlip} className="space-y-4 cursor-pointer">
              <Badge variant="outline" className="uppercase text-[10px] tracking-wide">
                {showBack ? "Answer" : "Question"}
              </Badge>
              <h3 className="text-xl font-semibold leading-snug">{showBack ? card.answer : card.question}</h3>
              {!showBack && (
                <p className="text-sm text-muted-foreground">
                  Tap to reveal. Difficulty score: {difficultyLabel(scores[card.id] ?? 0)}
                </p>
              )}
              {showBack && (
                <div className="space-y-2">
                  {card.keyPoints.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Key points</p>
                      <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                        {card.keyPoints.map((point, index) => (
                          <li key={index} className="flex gap-2">
                            <span>•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {card.followUpPrompts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Reflect further</p>
                      <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                        {card.followUpPrompts.map((prompt, index) => (
                          <li key={index} className="flex gap-2">
                            <span>→</span>
                            <span>{prompt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handlePrev} disabled={safeIndex === 0}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNext} disabled={safeIndex === flashcards.length - 1}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleFlip}>
                <RefreshCcw className="h-4 w-4" />
                {showBack ? "Show question" : "Reveal answer"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="hidden h-full flex-col overflow-hidden lg:flex">
          <div className="border-b px-5 py-4">
            <h3 className="text-sm font-semibold leading-tight">Progress</h3>
            <p className="text-xs text-muted-foreground">Track how you rated each card.</p>
          </div>
          <ScrollArea className="flex-1 px-5 py-4">
            <div className="space-y-4">
              {flashcards.map((item) => (
                <div key={item.id} className={cn("rounded-lg border p-3", item.id === card.id && "border-primary")}>
                  <p className="line-clamp-2 text-sm font-medium">{item.question}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {ratingHistory[item.id]?.map((rating, idx) => (
                      <span key={idx} className={cn("rounded-full px-2 py-0.5", ratingColor(rating))}>
                        {rating}
                      </span>
                    ))}
                    {!(ratingHistory[item.id]?.length > 0) && <span>Not reviewed yet</span>}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-center">
        <Button
          className={cn("rounded-full px-5", ratingColor("again"))}
          variant="outline"
          onClick={() => handleRating("again")}
        >
          Again
        </Button>
        <Button
          className={cn("rounded-full px-5", ratingColor("hard"))}
          variant="outline"
          onClick={() => handleRating("hard")}
        >
          Hard
        </Button>
        <Button
          className={cn("rounded-full px-5", ratingColor("good"))}
          variant="outline"
          onClick={() => handleRating("good")}
        >
          Good
        </Button>
        <Button
          className={cn("rounded-full px-5", ratingColor("easy"))}
          variant="outline"
          onClick={() => handleRating("easy")}
        >
          Easy
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          Reviewed {aggregatedStats.total} card{aggregatedStats.total === 1 ? "" : "s"} ·{" "}
          {Math.round(((safeIndex + 1) / flashcards.length) * 100)}% through deck
        </div>
        <div className="flex items-center gap-2">
          {onExit && (
            <Button variant="ghost" size="sm" onClick={onExit}>
              End session
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

