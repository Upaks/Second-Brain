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
      return NextResponse.json({ error: "No subscription found" }, { status: 400 })
    }

    // Resume subscription (cancel the cancellation)
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    })

    await prisma.subscription.update({
      where: { userId: user.id },
      data: { cancelAtPeriodEnd: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Resume subscription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

