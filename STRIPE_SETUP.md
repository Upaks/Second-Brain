# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payments for your application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Your database migrations run (Prisma schema updated)

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Run Database Migrations

```bash
npx prisma migrate dev --name add_subscriptions
```

This will create the `Subscription` and `Payment` tables in your database.

## Step 3: Set Up Stripe Products and Prices

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add Product**
3. Create two products:
   - **Pro Plan**: $12/month
   - **Team Plan**: $29/month per user

4. For each product:
   - Set the pricing to **Recurring** (monthly)
   - Copy the **Price ID** (starts with `price_`)

## Step 4: Configure Environment Variables

Add these environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key (test mode for development)
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret (see Step 5)
STRIPE_PRICE_ID_PRO_MONTHLY=price_... # Price ID for Pro plan
STRIPE_PRICE_ID_TEAM_MONTHLY=price_... # Price ID for Team plan

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000 # or your production URL
```

### Getting Your Stripe Keys

1. **Secret Key**: 
   - Go to [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys)
   - Copy the **Secret key** (starts with `sk_test_` for test mode)

2. **Webhook Secret** (see Step 5)

## Step 5: Set Up Stripe Webhooks

Webhooks allow Stripe to notify your app about subscription events (payments, cancellations, etc.).

### For Local Development:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add it to your `.env` as `STRIPE_WEBHOOK_SECRET`

### For Production:

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** and add it to your production environment variables

## Step 6: Test the Integration

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Test the checkout flow:
   - Go to your pricing page
   - Click "Start Free Trial" on Pro or Team plan
   - Use Stripe test card: `4242 4242 4242 4242`
   - Use any future expiry date and any CVC
   - Complete the checkout

3. Verify in Stripe Dashboard:
   - Check that a customer was created
   - Check that a subscription was created
   - Check that the webhook events were received

4. Verify in your app:
   - Go to `/dashboard/settings`
   - You should see your subscription status
   - Check your database for the subscription record

## How It Works

### Subscription Flow

1. **User clicks "Start Free Trial"** → Creates a Stripe Checkout session
2. **User completes payment** → Stripe redirects to success page
3. **Stripe sends webhook** → Your app updates the subscription in the database
4. **User sees subscription** → Displayed in Settings page

### Recurring Payments

- Stripe automatically charges the customer each month
- When a payment succeeds, Stripe sends a webhook
- Your app records the payment and updates subscription status
- If payment fails, subscription status is set to `PAST_DUE`

### Cancellation

- Users can cancel from the Settings page
- Subscription continues until the end of the billing period
- Users can resume before the period ends
- After the period ends, subscription status becomes `CANCELED`

## Database Schema

The integration adds two new models:

- **Subscription**: Tracks user subscription status, plan, and Stripe IDs
- **Payment**: Records all payment transactions

## API Routes

- `POST /api/checkout` - Creates a Stripe checkout session
- `POST /api/webhooks/stripe` - Handles Stripe webhook events
- `POST /api/subscription/cancel` - Cancels a subscription
- `POST /api/subscription/resume` - Resumes a canceled subscription

## Utility Functions

Use these functions to check subscription status in your code:

```typescript
import { getUserPlan, hasActiveSubscription, getPlanLimits } from "@/lib/subscription"

// Get user's current plan
const plan = await getUserPlan(userId) // "FREE" | "PRO" | "TEAM"

// Check if user has active subscription
const hasActive = await hasActiveSubscription(userId)

// Get plan limits
const limits = getPlanLimits(plan)
```

## Troubleshooting

### Webhooks not working?

1. Check that `STRIPE_WEBHOOK_SECRET` is set correctly
2. Verify the webhook endpoint URL is correct
3. Check Stripe Dashboard → Webhooks → Events for errors
4. Check your server logs for webhook errors

### Subscription not showing in database?

1. Check that webhooks are being received (Stripe Dashboard)
2. Verify webhook handler is working (check server logs)
3. Ensure database migrations ran successfully

### Checkout not redirecting?

1. Verify `NEXT_PUBLIC_APP_URL` is set correctly
2. Check Stripe Dashboard → Checkout sessions for errors
3. Ensure Stripe keys are correct (test vs live mode)

## Security Notes

- Never commit your Stripe secret keys to version control
- Use test keys for development, live keys for production
- Always verify webhook signatures (already implemented)
- Use environment variables for all sensitive configuration

## Next Steps

- Add usage limits based on subscription plan
- Implement feature gating (e.g., only Pro users can use advanced features)
- Add email notifications for subscription events
- Set up dunning management for failed payments

