import { Empty, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { ReminderCard } from "./reminder-card"
import { Bell } from "lucide-react"
import type { Reminder, Insight, Tag, InsightTag } from "@prisma/client"

interface ReminderWithInsight extends Reminder {
  insight:
    | (Insight & {
        tags: (InsightTag & { tag: Tag })[]
      })
    | null
}

interface RemindersListProps {
  upcoming: ReminderWithInsight[]
  past: ReminderWithInsight[]
}

export function RemindersList({ upcoming, past }: RemindersListProps) {
  if (upcoming.length === 0 && past.length === 0) {
    return (
      <Empty>
        <EmptyIcon>
          <Bell className="h-8 w-8 text-muted-foreground" />
        </EmptyIcon>
        <EmptyTitle>No reminders set</EmptyTitle>
        <EmptyDescription>Set reminders on insights to get notified at the right time</EmptyDescription>
      </Empty>
    )
  }

  return (
    <div className="space-y-8">
      {upcoming.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Upcoming</h2>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {upcoming.length}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} type="upcoming" />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Past</h2>
            <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
              {past.length}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {past.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} type="past" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
