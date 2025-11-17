"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, Calendar, CreditCard } from "lucide-react"
import { format } from "date-fns"

interface SubscriptionManagerProps {
  subscription: {
    id: string
    plan: string
    status: string
    stripeCurrentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
  } | null
}

export function SubscriptionManager({ subscription }: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<"cancel" | "resume" | null>(null)
  const router = useRouter()

  const handleCancel = async () => {
    setLoading(true)
    setAction("cancel")
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to cancel subscription")
      }

      router.refresh()
    } catch (error) {
      console.error("Cancel error:", error)
      alert("Failed to cancel subscription. Please try again.")
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  const handleResume = async () => {
    setLoading(true)
    setAction("resume")
    try {
      const response = await fetch("/api/subscription/resume", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to resume subscription")
      }

      router.refresh()
    } catch (error) {
      console.error("Resume error:", error)
      alert("Failed to resume subscription. Please try again.")
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  const handleUpgrade = async (plan: "PRO" | "TEAM") => {
    setLoading(true)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("Failed to start checkout. Please try again.")
      setLoading(false)
    }
  }

  if (!subscription || subscription.status === "INACTIVE") {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-purple-400" />
            </div>
            <CardTitle className="text-white">Subscription</CardTitle>
          </div>
          <CardDescription className="text-slate-300">
            You're currently on the Free plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button
              onClick={() => handleUpgrade("PRO")}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Upgrade to Pro - $12/month"
              )}
            </Button>
            <Button
              onClick={() => handleUpgrade("TEAM")}
              disabled={loading}
              variant="outline"
              className="w-full h-12 bg-slate-800/40 border-slate-600/70 text-slate-100 hover:bg-slate-800/60 hover:border-purple-500/70 hover:text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Upgrade to Team - $29/month"
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Includes 14-day free trial. Cancel anytime.
          </p>
        </CardContent>
      </Card>
    )
  }

  const isActive = subscription.status === "ACTIVE" || subscription.status === "TRIALING"
  const isCanceled = subscription.cancelAtPeriodEnd || subscription.status === "CANCELED"

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800/50 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-white">Subscription</CardTitle>
              <CardDescription className="text-slate-300">
                Manage your subscription and billing
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={
              subscription.status === "ACTIVE"
                ? "default"
                : subscription.status === "TRIALING"
                  ? "secondary"
                  : subscription.status === "PAST_DUE"
                    ? "destructive"
                    : "outline"
            }
            className={
              subscription.status === "ACTIVE"
                ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300"
                : subscription.status === "TRIALING"
                  ? "bg-gradient-to-r from-purple-500/40 to-pink-500/40 border-purple-400/70 text-purple-100"
                  : subscription.status === "PAST_DUE"
                    ? "bg-red-500/20 border-red-500/30 text-red-300"
                    : "bg-slate-800/50 border-slate-700/50 text-slate-300"
            }
          >
            {subscription.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-purple-400" />
              <span className="font-medium text-slate-200">Plan</span>
            </div>
            <span className="text-lg font-semibold text-white">{subscription.plan}</span>
          </div>

          {subscription.stripeCurrentPeriodEnd && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-purple-400" />
                <span className="font-medium text-slate-200">
                  {subscription.status === "TRIALING" ? "Trial ends" : "Renews"}
                </span>
              </div>
              <span className="text-slate-100">
                {format(new Date(subscription.stripeCurrentPeriodEnd), "MMM d, yyyy")}
              </span>
            </div>
          )}

          {isCanceled && (
            <div className="flex items-center gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <XCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
              <span className="text-sm text-yellow-200">
                Your subscription will cancel at the end of the current billing period.
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          {isActive && !isCanceled && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="bg-slate-800/40 border-slate-600/70 text-slate-100 hover:bg-red-500/10 hover:text-white hover:border-red-500/70"
            >
              {loading && action === "cancel" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          )}

          {isCanceled && subscription.status !== "CANCELED" && (
            <Button
              onClick={handleResume}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50"
            >
              {loading && action === "resume" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resuming...
                </>
              ) : (
                "Resume Subscription"
              )}
            </Button>
          )}

          {subscription.status === "PAST_DUE" && (
            <Button
              asChild
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50"
            >
              <a href="/#pricing">Update Payment Method</a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

