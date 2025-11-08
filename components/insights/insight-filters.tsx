"use client"

import { useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, X } from "lucide-react"
import type { Tag } from "@prisma/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const VISIBLE_TAG_COUNT = 8

interface InsightFiltersProps {
  tags: Tag[]
  selectedTag?: string
}

export function InsightFilters({ tags, selectedTag }: InsightFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { visibleTags, hiddenTags } = useMemo(() => {
    const visible = tags.slice(0, VISIBLE_TAG_COUNT)
    const hidden = tags.slice(VISIBLE_TAG_COUNT)
    return { visibleTags: visible, hiddenTags: hidden }
  }, [tags])

  function handleTagClick(tagName: string) {
    const params = new URLSearchParams(searchParams)
    if (selectedTag === tagName) {
      params.delete("tag")
    } else {
      params.set("tag", tagName)
    }
    router.push(`/dashboard/insights?${params.toString()}`)
  }

  function clearFilters() {
    router.push("/dashboard/insights")
  }

  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">Filter by tag:</span>

      <div className="flex flex-wrap items-center gap-2">
        {visibleTags.map((tag) => (
          <Badge
            key={tag.id}
            variant={selectedTag === tag.name ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/20 transition-colors max-w-[10rem] truncate"
            onClick={() => handleTagClick(tag.name)}
            title={tag.name}
          >
            {tag.name}
          </Badge>
        ))}

        {hiddenTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                +{hiddenTags.length} more
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 w-56 overflow-auto">
              {hiddenTags.map((tag) => (
                <DropdownMenuItem
                  key={tag.id}
                  className="flex items-center gap-2"
                  onClick={() => handleTagClick(tag.name)}
                >
                  <span
                    className={`truncate ${selectedTag === tag.name ? "font-semibold text-primary" : ""}`}
                    title={tag.name}
                  >
                    {tag.name}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {selectedTag && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}
