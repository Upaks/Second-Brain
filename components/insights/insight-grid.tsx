"use client"

import { useMemo, useState, useTransition } from "react"
import { Empty, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { InsightCardExpanded } from "./insight-card-expanded"
import { Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { InsightGridItem, AvailableTag } from "@/types/insights"

interface InsightGridProps {
  insights: InsightGridItem[]
  availableTags: AvailableTag[]
  onDeleted?: (ids: string[]) => void
}

function normalizeTags(input: string) {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 1 && tag.length <= 40),
    ),
  )
}

export function InsightGrid({ insights, availableTags, onDeleted }: InsightGridProps) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [tagMode, setTagMode] = useState<"add" | "remove">("add")
  const [tagInput, setTagInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const emitInvalidateEvent = () => window.dispatchEvent(new Event("insights:invalidate"))
  const revalidateServerData = async () => {
    try {
      await fetch("/api/insights/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
    } catch (error) {
      console.error("[v0] Failed to revalidate insights:", error)
    } finally {
      emitInvalidateEvent()
    }
  }

  const selectedCount = selectedIds.length
  const normalizedTagInput = useMemo(() => normalizeTags(tagInput), [tagInput])

  function toggleSelecting() {
    setIsSelecting((prev) => {
      if (prev) {
        setSelectedIds([])
      }
      return !prev
    })
  }

  function toggleSelection(insightId: string) {
    setSelectedIds((prev) => {
      if (prev.includes(insightId)) {
        return prev.filter((id) => id !== insightId)
      }
      return [...prev, insightId]
    })
  }

  function clearSelection() {
    setSelectedIds([])
    setIsSelecting(false)
  }

  function openTagDialog(mode: "add" | "remove") {
    setTagMode(mode)
    setTagInput("")
    setError(null)
    setIsTagDialogOpen(true)
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0 || isBulkDeleting) return
    if (!confirm(`Delete ${selectedIds.length} selected insight${selectedIds.length > 1 ? "s" : ""}?`)) {
      return
    }

    setIsBulkDeleting(true)
    try {
      const res = await fetch("/api/insights/bulk/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightIds: selectedIds }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to delete insights")
      }

      onDeleted?.(selectedIds)
      setSelectedIds([])
      setIsSelecting(false)
      await revalidateServerData()
    } catch (err) {
      console.error("[v0] Bulk delete error:", err)
      alert(err instanceof Error ? err.message : "Failed to delete insights.")
    } finally {
      setIsBulkDeleting(false)
    }
  }

  function appendTag(name: string) {
    const normalized = name.toLowerCase()
    if (!normalizedTagInput.includes(normalized)) {
      setTagInput((prev) => (prev ? `${prev}, ${normalized}` : normalized))
    }
  }

  function handleApplyTags() {
    const tags = normalizeTags(tagInput)

    if (tags.length === 0) {
      setError("Add at least one tag.")
      return
    }

    startTransition(async () => {
      setError(null)
      try {
        const res = await fetch("/api/insights/bulk/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: tagMode,
            insightIds: selectedIds,
            tags,
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? "Failed to update tags")
        }

        setIsTagDialogOpen(false)
        setTagInput("")
        setSelectedIds([])
        setIsSelecting(false)
        await revalidateServerData()
      } catch (err) {
        console.error("[v0] Bulk tag update error:", err)
        setError(err instanceof Error ? err.message : "Failed to update tags")
      }
    })
  }

  if (insights.length === 0) {
    return (
      <Empty>
        <EmptyIcon>
          <Lightbulb className="h-8 w-8 text-muted-foreground" />
        </EmptyIcon>
        <EmptyTitle>No insights found</EmptyTitle>
        <EmptyDescription>Try adjusting your filters or create new insights</EmptyDescription>
      </Empty>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isSelecting
            ? selectedCount > 0
              ? `${selectedCount} selected`
              : "Select insights to apply actions"
            : "Bulk actions"}
        </div>
        <div className="flex items-center gap-2">
          {isSelecting && (
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Cancel
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={toggleSelecting}>
            {isSelecting ? "Done" : "Select"}
          </Button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium">{selectedCount} insights selected</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openTagDialog("add")}
            disabled={isPending || isBulkDeleting}
          >
            Add tags
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openTagDialog("remove")}
            disabled={isPending || isBulkDeleting}
          >
            Remove tags
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={isPending || isBulkDeleting}
          >
            {isBulkDeleting ? "Deleting..." : "Delete"}
          </Button>
          <Button size="sm" variant="ghost" onClick={clearSelection} disabled={isPending || isBulkDeleting}>
            Clear selection
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight) => {
          const selected = selectedIds.includes(insight.id)

          return (
            <div
              key={insight.id}
              className={cn(
                "relative transition-all",
                isSelecting && "cursor-pointer",
                isSelecting && selected ? "ring-2 ring-primary rounded-xl" : "",
              )}
              onClick={
                isSelecting
                  ? (event) => {
                      event.preventDefault()
                      toggleSelection(insight.id)
                    }
                  : undefined
              }
            >
              {isSelecting && (
                <div
                  className="absolute left-4 top-4 z-20"
                  onClick={(event) => {
                    event.stopPropagation()
                  }}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked) => {
                      if (checked === "indeterminate") return
                      toggleSelection(insight.id)
                    }}
                  />
                </div>
              )}

              <div className={cn(isSelecting ? "pointer-events-none" : "")}>
                <InsightCardExpanded insight={insight} disableLink={isSelecting} />
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{tagMode === "add" ? "Add tags" : "Remove tags"}</DialogTitle>
            <DialogDescription>
              {tagMode === "add"
                ? "Apply the following tags to every selected insight."
                : "Remove the following tags from every selected insight."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-1 max-h-[60vh]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="bulk-tags">
                Tags (comma separated)
              </label>
              <Input
                id="bulk-tags"
                placeholder="research, ai, follow-up"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                disabled={isPending}
              />
            </div>

            {availableTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Quick pick</p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className="focus-visible:outline-none"
                      onClick={() => appendTag(tag.name)}
                      disabled={isPending}
                    >
                      <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                        {tag.name}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-2 pb-1">
              <div className="flex justify-end gap-2 w-full">
                <Button variant="ghost" onClick={() => setIsTagDialogOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button onClick={handleApplyTags} disabled={isPending || selectedCount === 0}>
                  {isPending ? "Applying..." : "Apply"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
