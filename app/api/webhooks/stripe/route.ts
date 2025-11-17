import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe, PRICE_ID_TO_PLAN } from "@/lib/stripe"
import { prisma } from "@/lib/db"
import Stripe from "stripe"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set")
}

// Type assertion: webhookSecret is guaranteed to be string after the check above
const WEBHOOK_SECRET: string = webhookSecret

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
    } catch (err) {
      console.error("[v0] Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`[v0] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const plan = session.metadata?.plan

  if (!userId || !plan) {
    console.error("[v0] Missing metadata in checkout session")
    return
  }

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id

  if (!customerId || !subscriptionId) {
    console.error("[v0] Missing customer or subscription ID")
    return
  }

  // Get subscription details from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = stripeSubscription.items.data[0]?.price.id
  const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000)

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: currentPeriodEnd,
      plan,
      status: stripeSubscription.status === "trialing" ? "TRIALING" : "ACTIVE",
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: currentPeriodEnd,
      plan,
      status: stripeSubscription.status === "trialing" ? "TRIALING" : "ACTIVE",
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) {
    console.error("[v0] Missing userId in subscription metadata")
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  const plan = priceId ? PRICE_ID_TO_PLAN[priceId] || "PRO" : "PRO"
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

  let status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "UNPAID" | "INACTIVE" = "INACTIVE"
  switch (subscription.status) {
    case "active":
      status = "ACTIVE"
      break
    case "trialing":
      status = "TRIALING"
      break
    case "past_due":
      status = "PAST_DUE"
      break
    case "canceled":
    case "unpaid":
      status = subscription.status === "canceled" ? "CANCELED" : "UNPAID"
      break
  }

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: currentPeriodEnd,
      plan,
      status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: currentPeriodEnd,
      plan,
      status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) {
    console.error("[v0] Missing userId in subscription metadata")
    return
  }

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: "CANCELED",
      stripeSubscriptionId: null,
      cancelAtPeriodEnd: false,
    },
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id
  if (!subscriptionId) {
    return
  }

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (!subscription) {
    console.error("[v0] Subscription not found for payment")
    return
  }

  // Record payment
  await prisma.payment.upsert({
    where: { stripePaymentId: invoice.payment_intent as string },
    create: {
      subscriptionId: subscription.id,
      stripePaymentId: invoice.payment_intent as string,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: "SUCCEEDED",
    },
    update: {
      status: "SUCCEEDED",
    },
  })

  // Update subscription status if it was past due
  if (subscription.status === "PAST_DUE") {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "ACTIVE" },
    })
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id
  if (!subscriptionId) {
    return
  }

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (!subscription) {
    return
  }

  // Record failed payment
  if (invoice.payment_intent) {
    await prisma.payment.upsert({
      where: { stripePaymentId: invoice.payment_intent as string },
      create: {
        subscriptionId: subscription.id,
        stripePaymentId: invoice.payment_intent as string,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: "FAILED",
      },
      update: {
        status: "FAILED",
      },
    })
  }

  // Update subscription status
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "PAST_DUE" },
  })
}

