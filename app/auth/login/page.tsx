"use client"

import { LoginForm } from "@/components/auth/login-form"
import { Brain, Sparkles } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function LoginPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl animate-pulse"
          style={{
            left: `${mousePosition.x / 30}px`,
            top: `${mousePosition.y / 30}px`,
            transition: "all 0.3s ease-out",
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-500/15 to-cyan-500/15 blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-violet-500/15 to-purple-500/15 blur-3xl animate-pulse delay-2000" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 mb-6 group">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/50">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Second Brain</span>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-xs font-semibold text-white">Welcome back</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3 text-white">
            Sign in to your
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Second Brain
            </span>
          </h1>
          <p className="text-white/70 text-center">Access your knowledge base and continue learning</p>
        </div>

        {/* Form Card */}
        <div className="relative rounded-3xl border-2 border-white/20 bg-slate-900/95 backdrop-blur-2xl p-8 shadow-2xl overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
          <div className="relative z-10">
            <LoginForm />
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-white/60">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Sign up for free
            </Link>
          </p>
          <Link href="/" className="inline-block text-sm text-white/50 hover:text-white/70 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
