"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import type { Collection, CollectionOnInsight, Insight, Tag, InsightTag } from "@prisma/client"
import { AddInsightDialog } from "./add-insight-dialog"
import { EditCollectionDialog } from "./edit-collection-dialog"

interface CollectionWithInsights extends Collection {
  insights: (CollectionOnInsight & {
    insight: Insight & {
      tags: (InsightTag & { tag: Tag })[]
    }
  })[]
}

interface CollectionDetailProps {
  collection: CollectionWithInsights
  userId: string
}

export function CollectionDetail({ collection, userId }: CollectionDetailProps) {
  const router = useRouter()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${collection.name}"? This cannot be undone.`)) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete")

      router.push("/dashboard/collections")
      router.refresh()
    } catch (error) {
      console.error("[v0] Delete collection error:", error)
      alert("Failed to delete collection")
      setIsDeleting(false)
    }
  }

  async function handleRemoveInsight(insightId: string) {
    if (!confirm("Remove this insight from the collection?")) return

    try {
      const res = await fetch(`/api/collections/${collection.id}/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remove: [insightId] }),
      })

      if (!res.ok) throw new Error("Failed to remove")

      router.refresh()
    } catch (error) {
      console.error("[v0] Remove insight error:", error)
      alert("Failed to remove insight")
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard/collections">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collections
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-3">{collection.name}</h1>
            {collection.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">{collection.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="hover:text-destructive hover:border-destructive bg-transparent"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span>{collection.insights.length} insights</span>
          <span>•</span>
          <span>Updated {formatDistanceToNow(new Date(collection.updatedAt), { addSuffix: true })}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Insights</h2>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Insight
        </Button>
      </div>

      {collection.insights.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {collection.insights.map(({ insight }) => (
            <Card key={insight.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <Link href={`/dashboard/insights/${insight.id}`} className="block group">
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {insight.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{insight.takeaway}</p>
                </Link>

                <div className="flex items-center justify-between pt-3 border-t">
                  {insight.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {insight.tags.slice(0, 3).map(({ tag }) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInsight(insight.id)}
                    className="ml-auto hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No insights in this collection yet</p>
          <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Insight
          </Button>
        </Card>
      )}

      <AddInsightDialog
        collectionId={collection.id}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onUpdate={() => router.refresh()}
      />

      <EditCollectionDialog
        collection={collection}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdate={() => router.refresh()}
      />
    </div>
  )
}
