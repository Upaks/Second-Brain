import { revalidateTag } from "next/cache"

const insightTagBase = (userId: string) => `insights:${userId}`
const insightTagWithFilter = (userId: string, tag?: string) =>
  tag ? `${insightTagBase(userId)}:tag:${tag}` : insightTagBase(userId)
const dashboardTagBase = (userId: string, scope: string) => `dashboard:${scope}:${userId}`
const PROFILE = "manual"

export const cacheTags = {
  insights: insightTagBase,
  insightFilter: insightTagWithFilter,
  dashboardRecent: (userId: string) => dashboardTagBase(userId, "recent"),
  dashboardCollections: (userId: string) => dashboardTagBase(userId, "collections"),
  dashboardTags: (userId: string) => dashboardTagBase(userId, "tags"),
  flashcards: (userId: string) => `flashcards:${userId}`,
}

export function revalidateInsights(userId: string, tag?: string) {
  revalidateTag(cacheTags.insights(userId), PROFILE)
  if (tag) {
    revalidateTag(cacheTags.insightFilter(userId, tag), PROFILE)
  }
  revalidateTag(cacheTags.dashboardRecent(userId), PROFILE)
}

export function revalidateCollections(userId: string) {
  revalidateTag(cacheTags.dashboardCollections(userId), PROFILE)
}

export function revalidateTags(userId: string) {
  revalidateTag(cacheTags.dashboardTags(userId), PROFILE)
}

export function revalidateFlashcards(userId: string) {
  revalidateTag(cacheTags.flashcards(userId), PROFILE)
}

