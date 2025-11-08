import OpenAI from "openai"

let client: OpenAI | null = null

export function getOpenAIClient() {
  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY
  if (!apiKey) {
    return null
  }

  if (!client) {
    const usingOpenRouter = Boolean(process.env.OPENROUTER_API_KEY)
    client = new OpenAI({
      apiKey,
      ...(usingOpenRouter
        ? {
            baseURL: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
            defaultHeaders: {
              "HTTP-Referer": process.env.OPENROUTER_SITE ?? "http://localhost:3000",
              "X-Title": process.env.OPENROUTER_APP_NAME ?? "Second Brain",
            },
          }
        : {}),
    })
  }

  return client
}

