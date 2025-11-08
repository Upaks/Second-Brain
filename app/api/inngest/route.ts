import { serve } from "inngest/next"

import { inngest } from "@/lib/inngest/client"
import { processIngestFunction } from "@/inngest/functions/process-ingest"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processIngestFunction],
})

