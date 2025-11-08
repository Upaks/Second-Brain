import { inngest } from "@/lib/inngest/client"
import { processIngestItemById } from "@/lib/ingest"

export const processIngestFunction = inngest.createFunction(
  { id: "process-ingest-item" },
  { event: "ingest/process" },
  async ({ event, step }) => {
    const ingestItemId = event.data.ingestItemId as string

    await step.run("run ingestion pipeline", async () => {
      await processIngestItemById(ingestItemId)
    })
  },
)

