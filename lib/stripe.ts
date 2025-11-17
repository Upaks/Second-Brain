import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
})

// Stripe Price IDs - you'll need to create these in your Stripe dashboard
export const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || "price_pro_monthly",
  TEAM_MONTHLY: process.env.STRIPE_PRICE_ID_TEAM_MONTHLY || "price_team_monthly",
} as const

// Plan mapping
export const PLAN_TO_PRICE_ID: Record<string, string> = {
  PRO: STRIPE_PRICE_IDS.PRO_MONTHLY,
  TEAM: STRIPE_PRICE_IDS.TEAM_MONTHLY,
}

export const PRICE_ID_TO_PLAN: Record<string, string> = {
  [STRIPE_PRICE_IDS.PRO_MONTHLY]: "PRO",
  [STRIPE_PRICE_IDS.TEAM_MONTHLY]: "TEAM",
}

