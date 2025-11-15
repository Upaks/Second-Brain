import { Inngest } from "inngest"

const eventKey = process.env.INNGEST_EVENT_KEY

export const inngest = new Inngest({
  id: process.env.INNGEST_APP_ID ?? "ai-second-brain",
  defaultEventName: "app/event",
  ...(eventKey ? { eventKey } : {}),
})

export const isInngestConfigured = Boolean(eventKey)
