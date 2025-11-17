"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { ArrowRight, User, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react"

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create account")
      }

      const redirectParam = searchParams.get("redirect")
      const planParam = searchParams.get("plan")
      
      // Always use a valid path for NextAuth callbackUrl
      const callbackUrl = "/dashboard"

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      // If they came from checkout, redirect to pricing page with plan parameter
      if (redirectParam === "checkout" && planParam) {
        router.push(`/#pricing?plan=${planParam}`)
      } else {
        router.push(result?.url ?? callbackUrl)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white/90 font-medium">
          Full name
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            disabled={isLoading}
            className="h-12 pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-white/90 font-medium">
          Email address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            disabled={isLoading}
            className="h-12 pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-white/90 font-medium">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            required
            disabled={isLoading}
            className="h-12 pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <p className="text-xs text-white/50">Must be at least 8 characters long</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all group"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Spinner size="sm" className="mr-2" />
            Creating account...
          </>
        ) : (
          <>
            Create Account
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>

      <p className="text-xs text-white/50 text-center leading-relaxed">
        By creating an account, you agree to our{" "}
        <a href="#" className="text-purple-400 hover:text-purple-300 underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="text-purple-400 hover:text-purple-300 underline">
          Privacy Policy
        </a>
      </p>
    </form>
  )
}
