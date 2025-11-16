"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import type { Tag } from "@prisma/client"

interface TagManagerProps {
  insightId: string
  currentTags: Tag[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function TagManager({ insightId, currentTags, open, onOpenChange, onUpdate }: TagManagerProps) {
  const [newTag, setNewTag] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleAddTag() {
    if (!newTag.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/insights/${insightId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add: [newTag.trim()] }),
      })

      if (!res.ok) throw new Error("Failed to add tag")

      setNewTag("")
      onUpdate()
    } catch (error) {
      console.error("[v0] Add tag error:", error)
      alert("Failed to add tag")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRemoveTag(tagId: string) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/insights/${insightId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remove: [tagId] }),
      })

      if (!res.ok) throw new Error("Failed to remove tag")

      onUpdate()
    } catch (error) {
      console.error("[v0] Remove tag error:", error)
      alert("Failed to remove tag")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">Manage Tags</DialogTitle>
          <DialogDescription className="text-white/60">Add or remove tags to organize this insight</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              disabled={isLoading}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500/50 focus:ring-purple-500/20"
            />
            <Button 
              onClick={handleAddTag} 
              disabled={isLoading || !newTag.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20">
                {tag.name}
                <button 
                  onClick={() => handleRemoveTag(tag.id)} 
                  disabled={isLoading} 
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
