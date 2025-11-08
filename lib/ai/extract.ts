import { getOpenAIClient } from "./openai"

export async function extractTextFromImage(buffer: Buffer, mime: string) {
  const client = getOpenAIClient()
  if (!client) return ""

  try {
    const base64 = buffer.toString("base64")
    const completion = await client.chat.completions.create({
      model:
        process.env.OPENROUTER_OCR_MODEL ??
        (process.env.OPENROUTER_API_KEY ? "gpt-4o-mini" : process.env.OPENAI_SUMMARY_MODEL ?? "gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: "You are an OCR engine. Return ONLY the text visible in the image, one line per line in the image.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract every piece of readable text from this image. If none, respond with an empty string.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mime};base64,${base64}`,
              },
            },
          ],
        },
      ],
      temperature: 0,
    })

    return completion.choices[0]?.message?.content?.trim() ?? ""
  } catch (error) {
    console.error("[ai] image OCR error", error)
    return ""
  }
}

export async function extractTextFromAudio(_buffer: Buffer, _mime: string) {
  console.warn("[ai] audio transcription not implemented; returning empty string")
  return ""
}

