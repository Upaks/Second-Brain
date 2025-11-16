"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Brain, Play, Sparkles, TrendingUp, Zap, Star } from "lucide-react"
import { useState, useEffect } from "react"

export function HeroSection() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-3xl animate-pulse"
          style={{
            left: `${mousePosition.x / 20}px`,
            top: `${mousePosition.y / 20}px`,
            transition: "all 0.3s ease-out",
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 blur-3xl animate-pulse delay-2000" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-4 shadow-lg">
                <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                <span className="text-sm font-semibold text-white">AI-Powered • Trusted by 10K+ Users</span>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>

              {/* Main Headline */}
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-tight">
                <span className="block text-white mb-2">Your AI</span>
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  Second Brain
                </span>
                <span className="block text-white/90 text-5xl sm:text-6xl lg:text-7xl mt-2">
                  That Never Forgets
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl sm:text-2xl text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Capture everything you learn. Find it instantly with{" "}
                <span className="text-white font-semibold">AI-powered search</span>. Never lose an idea again.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                  <span className="text-white font-medium">10,000+ users</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-medium">4.9/5 rating</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                  <Zap className="h-4 w-4 text-blue-400" />
                  <span className="text-white font-medium">99.9% uptime</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all group"
                  asChild
                >
                  <Link href="/auth/signup">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg font-semibold bg-white/10 backdrop-blur-xl border-white/30 text-white hover:bg-white/20 hover:scale-105 transition-all"
                  onClick={() => setIsVideoPlaying(true)}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative lg:block hidden">
              <div className="relative">
                {/* Main mockup */}
                <div className="relative rounded-3xl border-2 border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden p-1">
                  <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6">
                    {/* Mockup header */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      </div>
                      <div className="flex-1 h-8 rounded-lg bg-slate-700/50 ml-4" />
                    </div>

                    {/* Mockup content */}
                    <div className="space-y-3">
                      <div className="h-4 w-3/4 rounded bg-gradient-to-r from-purple-500/50 to-pink-500/50" />
                      <div className="h-4 w-full rounded bg-slate-700/50" />
                      <div className="h-4 w-5/6 rounded bg-slate-700/50" />
                      <div className="h-20 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 mt-4 flex items-center justify-center">
                        <Brain className="h-10 w-10 text-purple-400" />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <div className="h-8 flex-1 rounded-lg bg-slate-700/50" />
                        <div className="h-8 w-20 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating cards */}
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/20 shadow-xl animate-float">
                  <div className="p-4 h-full flex flex-col justify-center items-center">
                    <Zap className="h-8 w-8 text-cyan-400 mb-2" />
                    <div className="text-xs font-semibold text-white">Fast</div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/20 shadow-xl animate-float-delayed">
                  <div className="p-4 h-full flex flex-col justify-center items-center">
                    <Brain className="h-8 w-8 text-pink-400 mb-2" />
                    <div className="text-xs font-semibold text-white">Smart</div>
                  </div>
                </div>

                {/* Glow effects */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl rounded-3xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
        </div>
      </div>
    </section>
  )
}
