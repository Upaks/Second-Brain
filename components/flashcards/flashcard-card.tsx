"use client"

import { memo } from "react"
import type { Flashcard } from "@/lib/flashcards"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const themes = {
  default: {
    container: "bg-white/95 border-slate-200 text-slate-900",
    overlay: "from-slate-100/40 via-white/10 to-white/0",
    chip: "bg-slate-900/5 text-slate-600",
  },
  midnight: {
    container: "bg-slate-950/90 border-slate-800 text-slate-100",
    overlay: "from-slate-800/60 via-slate-900/20 to-slate-950/0",
    chip: "bg-white/10 text-white/80",
  },
  sunrise: {
    container: "bg-gradient-to-br from-rose-100 via-amber-100 to-emerald-100 border-amber-200 text-slate-900",
    overlay: "from-white/70 via-transparent to-transparent",
    chip: "bg-white/50 text-slate-700",
  },
  nebula: {
    container: "bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-indigo-700 text-indigo-50",
    overlay: "from-indigo-500/30 via-transparent to-purple-500/20",
    chip: "bg-white/15 text-white/80",
  },
} as const

const cardSizes = {
  sm: {
    container: "min-h-[200px]",
    title: "text-lg",
    body: "text-xs",
    padding: "p-5",
  },
  md: {
    container: "min-h-[240px]",
    title: "text-xl",
    body: "text-sm",
    padding: "p-6",
  },
  lg: {
    container: "min-h-[280px]",
    title: "text-2xl",
    body: "text-base",
    padding: "p-7",
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
  const typeLabel =
    card.cardType === "core" ? "Core insight" : card.cardType === "detail" ? "Deep dive" : "Tag lens"

  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-3xl border transition-transform duration-300",
        palette.container,
        sizeTokens.container,
        fontFamily,
        isSelected ? "ring-2 ring-primary/80" : "hover:-translate-y-1 hover:shadow-xl",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70 transition-opacity duration-500",
          palette.overlay,
        )}
      />
      <div className={cn("relative flex h-full flex-col justify-between gap-8", sizeTokens.padding)}>
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide">
          <span className="inline-flex items-center gap-2 text-xs font-medium opacity-80">
            {showBack ? "Answer" : "Prompt"}
            <Badge
              variant="secondary"
              className={cn(
                "rounded-full border border-transparent px-2 py-0.5 text-[10px] uppercase tracking-wide",
                palette.chip,
              )}
            >
              {typeLabel}
            </Badge>
          </span>
          <Badge variant="outline" className="rounded-full bg-black/5 px-3 py-1 text-[10px] uppercase">
            {card.difficulty}
          </Badge>
        </div>

        <div className="space-y-4">
          {!showBack ? (
            <>
              <div className="space-y-3">
                <h3 className={cn("font-semibold leading-tight", sizeTokens.title)}>{card.title}</h3>
                <p className={cn("leading-relaxed opacity-90", sizeTokens.body)}>{card.question}</p>
              </div>
              {card.followUpPrompts.length > 0 && (
                <div className="space-y-2 rounded-2xl bg-black/5 p-4 text-xs opacity-90">
                  <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Deep dive prompts</div>
                  <ul className="space-y-1">
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
              <div className="space-y-3">
                <h3 className={cn("font-semibold leading-tight", sizeTokens.title)}>{card.answer || card.title}</h3>
                {card.keyPoints.length > 0 && (
                  <ul className={cn("space-y-2 rounded-2xl bg-black/5 p-4", sizeTokens.body)}>
                    {card.keyPoints.map((line, index) => (
                      <li key={index} className="flex gap-2">
                        <span>•</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {card.followUpPrompts.length > 0 && (
                <div className="space-y-2 rounded-2xl bg-black/5 p-4 text-xs">
                  <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Reflect further</div>
                  <ul className="space-y-1">
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
                <div className="text-[10px] uppercase tracking-wide opacity-70">
                  Source: {card.source.title ?? card.source.url}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {card.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide",
                palette.chip,
              )}
            >
              {tag}
            </span>
          ))}
          {card.tags.length > 4 && (
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide",
                palette.chip,
              )}
            >
              +{card.tags.length - 4}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export const FlashcardCard = memo(FlashcardCardComponent)

