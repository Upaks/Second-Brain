import jwt, { type SignOptions } from "jsonwebtoken"

interface ShareTokenPayload {
  deckId: string
  userId: string
  cardIds?: string[]
  exp?: number
  iat?: number
}

function getShareSecret(): string {
  const secret = process.env.FLASHCARDS_SHARE_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error("Missing FLASHCARDS_SHARE_SECRET or NEXTAUTH_SECRET environment variable")
  }
  return secret
}

export function createShareToken({
  deckId,
  userId,
  cardIds,
  expiresIn = "7d",
}: {
  deckId: string
  userId: string
  cardIds?: string[]
  expiresIn?: string | number
}): string {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  }
  return jwt.sign({ deckId, userId, cardIds }, getShareSecret(), options)
}

export function verifyShareToken(token: string | null | undefined): ShareTokenPayload | null {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return null
  }

  try {
    return jwt.verify(token, getShareSecret()) as ShareTokenPayload
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[flashcards-share] invalid token", error)
    }
    return null
  }
}
