"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, Link2, TagIcon, Plus, Bell, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNow, format } from "date-fns"
import type { Insight, Tag, InsightTag, IngestItem, InsightLink, Reminder } from "@prisma/client"
import { TagManager } from "./tag-manager"
import { ReminderDialog } from "./reminder-dialog"
import type { SearchResult } from "@/lib/search"

interface InsightWithRelations extends Insight {
  tags: (InsightTag & { tag: Tag })[]
  ingestItem: IngestItem | null
  linksTo: (InsightLink & {
    to: Insight & {
      tags: (InsightTag & { tag: Tag })[]
    }
  })[]
  linksFrom: (InsightLink & {
    from: Insight & {
      tags: (InsightTag & { tag: Tag })[]
    }
  })[]
  reminders: Reminder[]
}

interface InsightDetailProps {
  insight: InsightWithRelations
  userId: string
  relatedInsights?: SearchResult[]
}

type EditingReminder = { id: string; dueAt: string; note: string | null } | null

export function InsightDetail({ insight, userId, relatedInsights = [] }: InsightDetailProps) {
  const router = useRouter()
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false)
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<EditingReminder>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeletingInsight, setIsDeletingInsight] = useState(false)

  const allLinkedInsights = [...insight.linksTo.map((l) => l.to), ...insight.linksFrom.map((l) => l.from)]
  const nextReminder = insight.reminders[0] ?? null

  function handleReminderDialogChange(open: boolean) {
    setIsReminderDialogOpen(open)
    if (!open) {
      setEditingReminder(null)
    }
  }

  function openNewReminder() {
    setEditingReminder(null)
    setIsReminderDialogOpen(true)
  }

  function openEditReminder(reminder: Reminder) {
    setEditingReminder({
      id: reminder.id,
      dueAt: reminder.dueAt.toISOString(),
      note: reminder.note,
    })
    setIsReminderDialogOpen(true)
  }

  async function handleDeleteReminder(reminderId: string) {
    if (!confirm("Delete this reminder?")) return
    setPendingDeleteId(reminderId)
    try {
      const res = await fetch(`/api/reminders/${reminderId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete reminder")
      router.refresh()
    } catch (error) {
      console.error("[v0] Delete reminder error:", error)
      alert("Failed to delete reminder")
    } finally {
      setPendingDeleteId(null)
    }
  }

  async function handleDeleteInsight() {
    if (isDeletingInsight) return
    if (!confirm("Delete this insight permanently?")) return

    setIsDeletingInsight(true)
    try {
      const res = await fetch(`/api/insights/${insight.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete insight")

      router.push("/dashboard/insights")
      router.refresh()
    } catch (error) {
      console.error("[v0] Delete insight error:", error)
      alert("Failed to delete this insight. Please try again.")
      setIsDeletingInsight(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/insights">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Insights
            </Link>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteInsight}
            disabled={isDeletingInsight}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeletingInsight ? "Deleting…" : "Delete"}
          </Button>
        </div>

        <h1 className="text-4xl font-bold">{insight.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(new Date(insight.createdAt), "MMM d, yyyy")}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true })}
          </div>
        </div>

      {nextReminder && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary">
          <Bell className="h-4 w-4" />
          <div>
            Next reminder scheduled for {format(new Date(nextReminder.dueAt), "MMM d, yyyy h:mm a")} (
            {formatDistanceToNow(new Date(nextReminder.dueAt), { addSuffix: true })})
          </div>
        </div>
      )}
      </div>

      <Card className="p-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Key Takeaway</h2>
            <p className="text-xl font-medium leading-relaxed">{insight.takeaway}</p>
          </div>

          <Separator />

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Summary</h2>
            <div className="space-y-3">
              {insight.summary.split("\n").map((bullet, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-primary font-bold mt-1">•</span>
                  <p className="text-base leading-relaxed">{bullet}</p>
                </div>
              ))}
            </div>
          </div>

          {insight.content && (
            <>
              <Separator />
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  Full Content
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">{insight.content}</p>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TagIcon className="h-4 w-4" />
              Tags
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setIsTagManagerOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {insight.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {insight.tags.map(({ tag }) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tags yet</p>
          )}
        </Card>

        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Reminders
            </h3>
            <Button variant="ghost" size="sm" onClick={openNewReminder}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {insight.reminders.length > 0 ? (
            <div className="space-y-3">
              {insight.reminders.map((reminder) => {
                const dueDate = new Date(reminder.dueAt)
                const isOverdue = dueDate.getTime() < Date.now()
                const isDeleting = pendingDeleteId === reminder.id

                return (
                  <div key={reminder.id} className="rounded-md border border-border/60 bg-muted/20 px-3 py-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-medium">
                          <Bell className="h-4 w-4 text-primary" />
                          {format(dueDate, "MMM d, yyyy h:mm a")}
                          {isOverdue && (
                            <Badge variant="outline" className="border-amber-400 text-amber-500">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(dueDate, { addSuffix: true })}
                        </div>
                        {reminder.note && <p className="text-sm text-muted-foreground">{reminder.note}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditReminder(reminder)}
                          disabled={isDeleting}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteReminder(reminder.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {isDeleting ? "Removing..." : "Remove"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No reminders set</p>
          )}
        </Card>
      </div>

      {allLinkedInsights.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Link2 className="h-4 w-4" />
            Related Insights ({allLinkedInsights.length})
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            {allLinkedInsights.map((linked) => (
              <Link
                key={linked.id}
                href={`/dashboard/insights/${linked.id}`}
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <h4 className="font-medium mb-2 line-clamp-2">{linked.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-1">{linked.takeaway}</p>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {relatedInsights.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Link2 className="h-4 w-4" />
            Suggested Insights ({relatedInsights.length})
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            {relatedInsights.map((related) => (
              <Link
                key={related.id}
                href={`/dashboard/insights/${related.id}`}
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-medium mb-2 line-clamp-2">{related.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">{related.takeaway}</p>
                  </div>
                  {typeof related.similarity === "number" && (
                    <Badge variant="outline" className="ml-auto whitespace-nowrap">
                      Match {(related.similarity * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
                {related.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {related.tags.slice(0, 3).map(({ tag }) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <TagManager
        insightId={insight.id}
        currentTags={insight.tags.map((t) => t.tag)}
        open={isTagManagerOpen}
        onOpenChange={setIsTagManagerOpen}
        onUpdate={() => router.refresh()}
      />

      <ReminderDialog
        insightId={insight.id}
        open={isReminderDialogOpen}
        onOpenChange={handleReminderDialogChange}
        onUpdate={() => router.refresh()}
        reminder={editingReminder}
      />
    </div>
  )
}
