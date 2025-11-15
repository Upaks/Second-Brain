import { inngest, isInngestConfigured } from "./client"

export async function queueIngestProcessing(ingestItemId: string) {
  if (!isInngestConfigured) {
    return false
  }

  try {
    await inngest.send({
      name: "ingest/process",
      data: {
        ingestItemId,
      },
    })
    return true
  } catch (error) {
    console.error("[v0] inngest send failed", error)
    return false
  }
}

