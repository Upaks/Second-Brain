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
        <h1 className="text-4xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground text-lg">Find anything by meaning, not just keywords</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-3xl">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="What are you looking for?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              className="h-14 pl-12 text-base"
            />
          </div>
          <Button type="submit" size="lg" disabled={!query.trim() || isLoading} className="h-14 px-8 gap-2">
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
            <Empty>
              <EmptyIcon>
                <Search className="h-8 w-8 text-muted-foreground" />
              </EmptyIcon>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>Try adjusting your search query or create a new insight</EmptyDescription>
            </Empty>
          )
        ) : (
          <Empty>
            <EmptyIcon>
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </EmptyIcon>
            <EmptyTitle>Semantic Search</EmptyTitle>
            <EmptyDescription>Search naturally — ask questions, describe concepts, or use keywords</EmptyDescription>
            <div className="mt-6 space-y-2 text-left max-w-md">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Try:</strong> &ldquo;productivity tips I saved last month&rdquo;
              </p>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Or:</strong> &ldquo;articles about AI and design&rdquo;
              </p>
            </div>
          </Empty>
        )}
      </div>
    </div>
  )
}
