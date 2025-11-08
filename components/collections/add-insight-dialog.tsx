"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Search } from "lucide-react"
import type { Insight } from "@prisma/client"

interface AddInsightDialogProps {
  collectionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function AddInsightDialog({ collectionId, open, onOpenChange, onUpdate }: AddInsightDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
    }
  }, [open])

  async function handleSearch() {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      })

      if (!res.ok) throw new Error("Search failed")

      const data = await res.json()
      setResults(data.results || [])
    } catch (error) {
      console.error("[v0] Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAdd(insightId: string) {
    setIsAdding(insightId)
    try {
      const res = await fetch(`/api/collections/${collectionId}/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add: [insightId] }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to add insight")
      }

      onUpdate()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Add insight error:", error)
      alert(error instanceof Error ? error.message : "Failed to add insight")
    } finally {
      setIsAdding(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Insights</DialogTitle>
          <DialogDescription>Search for insights to add to this collection</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Search insights..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            disabled={isLoading}
          />
          <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
            {isLoading ? <Spinner size="sm" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {results.map((insight) => (
            <div key={insight.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium mb-1 line-clamp-2">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{insight.takeaway}</p>
                </div>
                <Button size="sm" onClick={() => handleAdd(insight.id)} disabled={isAdding === insight.id}>
                  {isAdding === insight.id ? <Spinner size="sm" /> : "Add"}
                </Button>
              </div>
            </div>
          ))}

          {results.length === 0 && query && !isLoading && (
            <p className="text-center text-sm text-muted-foreground py-8">No results found. Try a different search.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
