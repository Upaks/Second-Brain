"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { addDays, addHours, addWeeks, addMonths, setHours, setMinutes, format } from "date-fns"

interface ReminderDialogProps {
  insightId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
  reminder?: {
    id: string
    dueAt: string
    note: string | null
  } | null
}

function toLocalInputValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  const hours = `${date.getHours()}`.padStart(2, "0")
  const minutes = `${date.getMinutes()}`.padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function nextMorning(base: Date, hour = 9) {
  const tomorrow = addDays(base, 1)
  return setMinutes(setHours(tomorrow, hour), 0)
}

export function ReminderDialog({ insightId, open, onOpenChange, onUpdate, reminder }: ReminderDialogProps) {
  const [dueAt, setDueAt] = useState("")
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    if (reminder) {
      setDueAt(toLocalInputValue(new Date(reminder.dueAt)))
      setNote(reminder.note ?? "")
    } else {
      setDueAt("")
      setNote("")
    }
  }, [open, reminder])

  const quickOptions = useMemo(
    () => [
      {
        label: "Later today",
        compute: () => addHours(new Date(), 3),
      },
      {
        label: "Tomorrow morning",
        compute: () => nextMorning(new Date(), 9),
      },
      {
        label: "Next week",
        compute: () => addWeeks(new Date(), 1),
      },
      {
        label: "Next month",
        compute: () => addMonths(new Date(), 1),
      },
    ],
    [],
  )

  function applyQuickOption(getDate: () => Date) {
    const value = getDate()
    setDueAt(toLocalInputValue(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dueAt) return

    setIsLoading(true)
    try {
      const isoDue = new Date(dueAt).toISOString()
      const body = JSON.stringify({
        dueAt: isoDue,
        note: note || undefined,
      })

      const endpoint = reminder ? `/api/reminders/${reminder.id}` : `/api/insights/${insightId}/reminders`
      const method = reminder ? "PATCH" : "POST"

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      })

      if (!res.ok) throw new Error("Failed to create reminder")

      onOpenChange(false)
      onUpdate()
    } catch (error) {
      console.error("[v0] Create reminder error:", error)
      alert("Failed to create reminder")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!reminder) return
    if (!confirm("Delete this reminder?")) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/reminders/${reminder.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete reminder")

      onOpenChange(false)
      onUpdate()
    } catch (error) {
      console.error("[v0] Delete reminder error:", error)
      alert("Failed to delete reminder")
    } finally {
      setIsLoading(false)
    }
  }

  const dialogTitle = reminder ? "Update Reminder" : "Set Reminder"
  const dialogDescription = reminder
    ? `Adjust when you'd like to be reminded. Currently scheduled for ${format(new Date(reminder.dueAt), "PPpp")}.`
    : "Get reminded about this insight at a specific time."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-white/60">{dialogDescription}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/90">Quick pick</Label>
            <div className="flex flex-wrap gap-2">
              {quickOptions.map((option) => (
                <Button
                  key={option.label}
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => applyQuickOption(option.compute)}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueAt" className="text-white/90">When</Label>
            <Input
              id="dueAt"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              required
              disabled={isLoading}
              className="bg-white/5 border-white/20 text-white focus:border-purple-500/50 focus:ring-purple-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="text-white/90">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="Why remind me about this?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isLoading}
              rows={3}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-500/50 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all" 
              disabled={isLoading || !dueAt}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  {reminder ? "Updating..." : "Creating..."}
                </>
              ) : reminder ? (
                "Update Reminder"
              ) : (
                "Create Reminder"
              )}
            </Button>
            {reminder && (
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={handleDelete}
                className="w-full bg-white/10 text-red-400 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50"
              >
                Remove Reminder
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
