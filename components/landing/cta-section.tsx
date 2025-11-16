import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap } from "lucide-react"

export function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-pink-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-6">
            <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
            <span className="text-sm font-semibold text-white">Ready to get started?</span>
            <Zap className="h-4 w-4 text-yellow-400 animate-pulse" />
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6">
            <span className="text-white">Start Building Your</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Second Brain Today
            </span>
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of users who are already capturing, organizing, and retrieving knowledge with AI.
            No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Button
              size="lg"
              className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all group"
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
              className="h-14 px-10 text-lg font-semibold bg-white/10 backdrop-blur-xl border-white/30 text-white hover:bg-white/20 hover:scale-105 transition-all"
              asChild
            >
              <Link href="#pricing">View Pricing</Link>
            </Button>
          </div>
          <p className="text-sm text-white/60 flex items-center justify-center gap-2">
            <span>14-day free trial</span>
            <span>•</span>
            <span>No credit card required</span>
            <span>•</span>
            <span>Cancel anytime</span>
          </p>
        </div>
      </div>
    </section>
  )
}
