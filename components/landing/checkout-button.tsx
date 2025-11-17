"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2 } from "lucide-react"

interface CheckoutButtonProps {
  plan: "PRO" | "TEAM"
  cta: string
  className?: string
  variant?: "default" | "popular"
}

export function CheckoutButton({ plan, cta, className, variant = "default" }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCheckout = async () => {
    // Check if user is logged in by trying to fetch their session
    try {
      const sessionCheck = await fetch("/api/auth/session")
      const session = await sessionCheck.json()
      
      if (!session?.user) {
        // Redirect to signup/login
        router.push(`/auth/signup?redirect=checkout&plan=${plan}`)
        return
      }
    } catch (error) {
      // If session check fails, redirect to signup
      router.push(`/auth/signup?redirect=checkout&plan=${plan}`)
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/auth/signup?redirect=checkout&plan=${plan}`)
          return
        }
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

  return (
    <Button
      className={className}
      size="lg"
      onClick={handleCheckout}
      disabled={loading}
      data-plan={plan}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          {cta}
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  )
}

