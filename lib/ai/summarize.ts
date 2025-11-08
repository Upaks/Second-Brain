import { z } from "zod"

import { getOpenAIClient } from "./openai"

const InsightSchema = z.object({
  title: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(1).max(7),
  takeaway: z.string().min(1),
  tags: z.array(z.string().min(1)).max(10).optional(),
})

export type GeneratedInsight = z.infer<typeof InsightSchema>

const FALLBACK_INSIGHT: GeneratedInsight = {
  title: "Captured Insight",
  bullets: ["Review this item to add more detail."],
  takeaway: "Insight captured, awaiting refinement.",
  tags: ["unsorted"],
}

export async function generateInsightFromText(rawText: string, options?: { topicHint?: string }) {
  const input = rawText.slice(0, 8000).trim()
  if (!input) {
    return FALLBACK_INSIGHT
  }

  const client = getOpenAIClient()

  if (!client) {
    return {
      ...FALLBACK_INSIGHT,
      title: input.split("\n")[0]?.slice(0, 80) || FALLBACK_INSIGHT.title,
      takeaway: input.slice(0, 140) || FALLBACK_INSIGHT.takeaway,
    }
  }

  try {
    const prompt = `You are an expert knowledge curator. Convert the provided CONTENT into a concise insight card.
Return STRICT JSON matching this schema:
{
  "title": string (<= 90 characters),
  "bullets": string[3-7],
  "takeaway": string (<= 160 characters),
  "tags": string[3-8]
}
Rules:
- No markdown, quotes, or numbering.
- Tags should be short topical nouns.
- If the text is a URL or lacks context, infer purpose from domain.
- Keep language clear and direct.

${options?.topicHint ? `Focus on the topic: ${options.topicHint}.` : ""}

CONTENT:
"""
${input}
"""`

    const completion = await client.chat.completions.create({
      model:
        process.env.OPENROUTER_SUMMARY_MODEL ??
        process.env.OPENAI_SUMMARY_MODEL ??
        (process.env.OPENROUTER_API_KEY ? "meta-llama/llama-3.1-70b-instruct" : "gpt-4o-mini"),
      messages: [
        { role: "system", content: "You distill captured content into concise, accurate insight cards." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) {
      return FALLBACK_INSIGHT
    }

    const parsed = InsightSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      console.warn("[ai] summarize parse fallback", parsed.error?.message)
      return FALLBACK_INSIGHT
    }

    return parsed.data
  } catch (error) {
    console.error("[ai] summarize error", error)
    return FALLBACK_INSIGHT
  }
}

