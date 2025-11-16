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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-slate-900/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">Add Insights</DialogTitle>
          <DialogDescription className="text-white/60">Search for insights to add to this collection</DialogDescription>
        </DialogHeader>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 z-10" />
            <Input
              placeholder="Search insights..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              disabled={isLoading}
              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500/50 focus:ring-purple-500/20"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isLoading || !query.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all"
          >
            {isLoading ? <Spinner size="sm" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {results.map((insight) => (
            <div key={insight.id} className="p-4 rounded-xl border-2 border-white/20 bg-slate-800/50 hover:bg-slate-800/70 hover:border-white/40 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold mb-2 text-white line-clamp-2">{insight.title}</h4>
                  <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">{insight.takeaway}</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleAdd(insight.id)} 
                  disabled={isAdding === insight.id}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all whitespace-nowrap"
                >
                  {isAdding === insight.id ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Adding...
                    </>
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
            </div>
          ))}

          {results.length === 0 && query && !isLoading && (
            <div className="text-center py-12">
              <p className="text-sm text-white/60">No results found. Try a different search.</p>
            </div>
          )}

          {!query && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-sm text-white/60">Enter a search query to find insights</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
