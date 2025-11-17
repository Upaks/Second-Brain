import { prisma } from "./db"

export type SubscriptionPlan = "FREE" | "PRO" | "TEAM"

export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: {
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  })

  return subscription
}

export async function getUserPlan(userId: string): Promise<SubscriptionPlan> {
  const subscription = await getUserSubscription(userId)

  if (!subscription || subscription.status !== "ACTIVE") {
    return "FREE"
  }

  return (subscription.plan as SubscriptionPlan) || "FREE"
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId)
  return subscription?.status === "ACTIVE" || subscription?.status === "TRIALING" || false
}

export async function isSubscriptionActive(subscription: { status: string; stripeCurrentPeriodEnd: Date | null } | null): Promise<boolean> {
  if (!subscription) return false

  if (subscription.status !== "ACTIVE" && subscription.status !== "TRIALING") {
    return false
  }

  if (subscription.stripeCurrentPeriodEnd && subscription.stripeCurrentPeriodEnd < new Date()) {
    return false
  }

  return true
}

export function getPlanLimits(plan: SubscriptionPlan) {
  switch (plan) {
    case "FREE":
      return {
        capturesPerMonth: 100,
        collections: 5,
        hasAdvancedAI: false,
        hasPriorityProcessing: false,
        hasFlashcards: false,
        hasReminders: false,
        hasExport: false,
      }
    case "PRO":
      return {
        capturesPerMonth: Infinity,
        collections: Infinity,
        hasAdvancedAI: true,
        hasPriorityProcessing: true,
        hasFlashcards: true,
        hasReminders: true,
        hasExport: true,
      }
    case "TEAM":
      return {
        capturesPerMonth: Infinity,
        collections: Infinity,
        hasAdvancedAI: true,
        hasPriorityProcessing: true,
        hasFlashcards: true,
        hasReminders: true,
        hasExport: true,
        hasTeamWorkspaces: true,
        hasSSO: true,
        hasAnalytics: true,
      }
  }
}

