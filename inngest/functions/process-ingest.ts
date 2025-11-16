import { inngest } from "@/lib/inngest/client"
import { processIngestItemById } from "@/lib/ingest"

export const processIngestFunction = inngest.createFunction(
  {
    id: "process-ingest-item",
    retries: 3, // Limit retries to prevent infinite loops
    onFailure: async ({ error, event }) => {
      const ingestItemId = (event.data as { ingestItemId?: string })?.ingestItemId
      console.error(`[inngest] Failed to process ingest item ${ingestItemId ?? "unknown"}:`, error)
      // Don't retry if item is already processed or in error state
    },
  },
  { event: "ingest/process" },
  async ({ event, step }) => {
    const ingestItemId = event.data.ingestItemId as string

    await step.run("run ingestion pipeline", async () => {
      const result = await processIngestItemById(ingestItemId)
      // If item was skipped (already processed), don't throw error
      if (result && "skipped" in result && result.skipped) {
        console.log(`[inngest] Item ${ingestItemId} skipped - status: ${result.status}`)
        return { skipped: true, status: result.status }
      }
      return result
    })
  },
)

