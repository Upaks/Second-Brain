"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { SearchResults } from "./search-results"
import { Search, Sparkles } from "lucide-react"
import type { SearchResult } from "@/lib/search"

interface SearchInterfaceProps {
  userId: string
}

export function SearchInterface({ userId }: SearchInterfaceProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setHasSearched(true)

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
      alert("Search failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl sm:text-5xl font-black mb-3 text-white">Search</h1>
        <p className="text-white/70 text-lg">Find anything by meaning, not just keywords</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-3xl">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 z-10" />
            <Input
              placeholder="What are you looking for?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              className="h-14 pl-12 text-base bg-slate-900/95 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500/50 focus:ring-purple-500/20"
            />
          </div>
          <Button 
            type="submit" 
            size="lg" 
            disabled={!query.trim() || isLoading} 
            className="h-14 px-8 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                Searching...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Search
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="max-w-5xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : hasSearched ? (
          results.length > 0 ? (
            <SearchResults results={results} query={query} />
          ) : (
            <Empty className="border-white/20 bg-slate-900/50">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 mb-4">
                <Search className="h-12 w-12 text-purple-400" />
              </div>
              <EmptyTitle className="text-white">No results found</EmptyTitle>
              <EmptyDescription className="text-white/60">Try adjusting your search query or create a new insight</EmptyDescription>
            </Empty>
          )
        ) : (
          <Empty className="border-white/20 bg-slate-900/50">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 mb-4">
              <Sparkles className="h-12 w-12 text-purple-400" />
            </div>
            <EmptyTitle className="text-white">Semantic Search</EmptyTitle>
            <EmptyDescription className="text-white/60">Search naturally — ask questions, describe concepts, or use keywords</EmptyDescription>
            <div className="mt-6 space-y-2 text-left max-w-md">
              <p className="text-sm text-white/60">
                <strong className="text-white">Try:</strong> &ldquo;productivity tips I saved last month&rdquo;
              </p>
              <p className="text-sm text-white/60">
                <strong className="text-white">Or:</strong> &ldquo;articles about AI and design&rdquo;
              </p>
            </div>
          </Empty>
        )}
      </div>
    </div>
  )
}
