"use client"

import { memo } from "react"
import type { Flashcard } from "@/lib/flashcards"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const themes = {
  default: {
    bg: "bg-white",
    border: "border-border",
    text: "text-foreground",
  },
  midnight: {
    bg: "bg-slate-900",
    border: "border-slate-700",
    text: "text-slate-100",
  },
  sunrise: {
    bg: "bg-gradient-to-br from-amber-100 to-pink-100",
    border: "border-pink-200",
    text: "text-slate-900",
  },
} as const

const cardSizes = {
  sm: {
    container: "min-h-[180px]",
    title: "text-base",
    body: "text-xs",
  },
  md: {
    container: "min-h-[220px]",
    title: "text-lg",
    body: "text-sm",
  },
  lg: {
    container: "min-h-[260px]",
    title: "text-xl",
    body: "text-base",
  },
} as const

const fontFamilies = {
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
} as const

type ThemeKey = keyof typeof themes
type CardSizeKey = keyof typeof cardSizes
type FontKey = keyof typeof fontFamilies

interface FlashcardCardProps {
  card: Flashcard
  showBack: boolean
  theme?: ThemeKey
  size?: CardSizeKey
  font?: FontKey
  isSelected?: boolean
}

function FlashcardCardComponent({
  card,
  showBack,
  theme = "default",
  size = "md",
  font = "sans",
  isSelected = false,
}: FlashcardCardProps) {
  const palette = themes[theme] ?? themes.default
  const sizeTokens = cardSizes[size] ?? cardSizes.md
  const fontFamily = fontFamilies[font] ?? fontFamilies.sans

  return (
    <div
      className={cn(
        "w-full rounded-xl border shadow-sm transition-transform duration-200",
        palette.bg,
        palette.border,
        palette.text,
        sizeTokens.container,
        fontFamily,
        isSelected ? "ring-2 ring-primary/80" : "hover:shadow-md",
      )}
    >
      <div className="flex h-full flex-col p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {showBack ? "Answer" : "Prompt"}
          </span>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            {card.difficulty}
          </Badge>
        </div>
        {!showBack ? (
          <>
            <h3 className={cn("font-semibold leading-tight", sizeTokens.title)}>{card.title}</h3>
            <p className={cn("leading-relaxed text-muted-foreground", sizeTokens.body)}>{card.question}</p>
            {card.followUpPrompts.length > 0 && (
              <div className="pt-2 space-y-1">
                <div className="text-xs font-medium uppercase text-muted-foreground">Deep dive</div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {card.followUpPrompts.slice(0, 2).map((prompt, index) => (
                    <li key={index} className="flex gap-2">
                      <span>→</span>
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className={cn("font-semibold leading-tight", sizeTokens.title)}>{card.answer || card.title}</h3>
            {card.keyPoints.length > 0 && (
              <ul className={cn("space-y-1 text-muted-foreground", sizeTokens.body)}>
                {card.keyPoints.map((line, index) => (
                  <li key={index} className="flex gap-2">
                    <span>•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
            {card.followUpPrompts.length > 0 && (
              <div className="pt-2">
                <div className="text-xs font-medium uppercase text-muted-foreground">Reflection prompts</div>
                <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                  {card.followUpPrompts.map((prompt, index) => (
                    <li key={index} className="flex gap-2">
                      <span>?</span>
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {card.source?.url && (
              <div className="pt-3 text-[10px] uppercase tracking-wide text-muted-foreground">
                Source: {card.source.title ?? card.source.url}
              </div>
            )}
          </>
        )}

        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {card.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-muted-foreground dark:bg-white/10"
              >
                {tag}
              </span>
            ))}
            {card.tags.length > 4 && (
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-muted-foreground dark:bg-white/10">
                +{card.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export const FlashcardCard = memo(FlashcardCardComponent)

