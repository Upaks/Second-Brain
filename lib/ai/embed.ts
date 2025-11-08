import { getOpenAIClient } from "./openai"

const VECTOR_DIMENSION = Number(process.env.VECTOR_DIMENSION ?? "1536")

export async function generateEmbedding(input: string) {
  const content = input.trim()
  if (!content) return []

  const client = getOpenAIClient()
  if (!client) return []

  try {
    const result = await client.embeddings.create({
      model:
        process.env.OPENROUTER_EMBED_MODEL ??
        process.env.OPENAI_EMBED_MODEL ??
        (process.env.OPENROUTER_API_KEY ? "text-embedding-3-small" : "text-embedding-3-small"),
      input: content.slice(0, 8000),
    })

    let embedding = result.data[0]?.embedding ?? []

    if (embedding.length > VECTOR_DIMENSION) {
      console.warn(
        `[ai] embedding length ${embedding.length} exceeds configured dimension ${VECTOR_DIMENSION}, truncating.`,
      )
      embedding = embedding.slice(0, VECTOR_DIMENSION)
    } else if (embedding.length < VECTOR_DIMENSION) {
      embedding = embedding.concat(Array(VECTOR_DIMENSION - embedding.length).fill(0))
    }

    return embedding
  } catch (error) {
    console.error("[ai] embedding error", error)
    return []
  }
}

