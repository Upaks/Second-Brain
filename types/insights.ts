export type InsightTagRecord = {
  tag: {
    id: string
    name: string
  }
}

export type InsightReminderRecord = {
  id: string
  dueAt: Date
}

export type InsightListItem = {
  id: string
  title: string
  takeaway: string
  createdAt: Date
  tags: InsightTagRecord[]
  reminders: InsightReminderRecord[]
}

export type InsightGridItem = InsightListItem & {
  summaryPreview: string[]
  linkCount: number
}

export type AvailableTag = {
  id: string
  name: string
}

