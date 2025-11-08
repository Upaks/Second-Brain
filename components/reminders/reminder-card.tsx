"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Calendar, Trash2, CheckCircle } from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Reminder, Insight, Tag, InsightTag } from "@prisma/client"

interface ReminderWithInsight extends Reminder {
  insight:
    | (Insight & {
        tags: (InsightTag & { tag: Tag })[]
      })
    | null
}

interface ReminderCardProps {
  reminder: ReminderWithInsight
  type: "upcoming" | "past"
}

export function ReminderCard({ reminder, type }: ReminderCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const dueDate = new Date(reminder.dueAt)
  const isOverdue = isPast(dueDate) && !reminder.sentAt

  async function handleDelete() {
    if (!confirm("Delete this reminder?")) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/reminders/${reminder.id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete")

      router.refresh()
    } catch (error) {
      console.error("[v0] Delete reminder error:", error)
      alert("Failed to delete reminder")
      setIsDeleting(false)
    }
  }

  return (
    <Card className={`p-6 ${isOverdue ? "border-warning bg-warning/5" : ""}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {isOverdue ? (
                <Badge variant="outline" className="border-warning text-warning">
                  Overdue
                </Badge>
              ) : reminder.sentAt ? (
                <Badge variant="outline" className="border-success text-success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Sent
                </Badge>
              ) : (
                <Badge variant="outline">Scheduled</Badge>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{format(dueDate, "MMM d, yyyy")}</span>
                <span className="text-muted-foreground">at</span>
                <span className="font-medium">{format(dueDate, "h:mm a")}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatDistanceToNow(dueDate, { addSuffix: true })}
              </div>
            </div>

            {reminder.note && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{reminder.note}</p>}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {reminder.insight && (
          <Link href={`/dashboard/insights/${reminder.insight.id}`} className="block pt-4 border-t group">
            <h4 className="font-medium mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {reminder.insight.title}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-1">{reminder.insight.takeaway}</p>

            {reminder.insight.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {reminder.insight.tags.slice(0, 3).map(({ tag }) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </Link>
        )}
      </div>
    </Card>
  )
}
