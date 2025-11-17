import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 })
    }

    // Cancel at period end (don't cancel immediately)
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    await prisma.subscription.update({
      where: { userId: user.id },
      data: { cancelAtPeriodEnd: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Cancel subscription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

