import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { stripe, PLAN_TO_PRICE_ID } from "@/lib/stripe"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { plan } = body

    if (!plan || !["PRO", "TEAM"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const priceId = PLAN_TO_PRICE_ID[plan]
    if (!priceId) {
      return NextResponse.json({ error: "Price ID not configured" }, { status: 500 })
    }

    // Get or create Stripe customer
    let subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })

    let customerId: string

    if (subscription?.stripeCustomerId) {
      customerId = subscription.stripeCustomerId
    } else {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      })

      customerId = customer.id

      // Create or update subscription record
      if (subscription) {
        subscription = await prisma.subscription.update({
          where: { userId: user.id },
          data: { stripeCustomerId: customerId },
        })
      } else {
        subscription = await prisma.subscription.create({
          data: {
            userId: user.id,
            stripeCustomerId: customerId,
            plan: "FREE",
            status: "INACTIVE",
          },
        })
      }
    }

    // Create checkout session
    // Get base URL - prefer NEXT_PUBLIC_APP_URL, then VERCEL_URL, then default to localhost
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!baseUrl) {
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`
      } else {
        baseUrl = "http://localhost:3000"
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/settings?success=true`,
      cancel_url: `${baseUrl}/dashboard/settings?canceled=true`,
      metadata: {
        userId: user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
        },
        trial_period_days: 14, // 14-day free trial
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[v0] Checkout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

