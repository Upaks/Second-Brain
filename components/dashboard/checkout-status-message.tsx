"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CheckoutStatusMessageProps {
  success?: string
  canceled?: string
}

export function CheckoutStatusMessage({ success, canceled }: CheckoutStatusMessageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Clean up URL parameters after showing message
    if (success || canceled) {
      const timer = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("success")
        params.delete("canceled")
        const newUrl = params.toString() ? `?${params.toString()}` : ""
        router.replace(`/dashboard/settings${newUrl}`, { scroll: false })
      }, 5000) // Remove after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [success, canceled, router, searchParams])

  if (success === "true") {
    return (
      <Card className="p-5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl border-green-500/30 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-300 mb-2 text-lg">Payment Successful!</h3>
            <p className="text-sm text-green-200/90">
              Your subscription is being activated. This may take a few moments. Please refresh
              the page if your subscription status doesn't update automatically.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (canceled === "true") {
    return (
      <Card className="p-5 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 backdrop-blur-xl border-yellow-500/30 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
            <XCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-300 mb-2 text-lg">Checkout Canceled</h3>
            <p className="text-sm text-yellow-200/90 mb-4">
              Your checkout was canceled. No charges were made.
            </p>
            <Button
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.delete("canceled")
                router.push(`/#pricing?${params.toString()}`)
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50"
            >
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return null
}

