import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Brain, Search, Lightbulb, Clock } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-center">
            <div className="p-4 rounded-2xl bg-primary/10 backdrop-blur-sm">
              <Brain className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h1 className="text-6xl font-bold mb-6 tracking-tight">
            Your AI <span className="text-gradient">Second Brain</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-12 max-w-2xl leading-relaxed">
            Remember everything you read, hear, watch, or think — and get it back when it matters. Capture knowledge
            effortlessly and let AI organize it for you.
          </p>

          <div className="flex gap-4">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/auth/signup">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-transparent" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-32 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-8 rounded-2xl bg-card border border-border card-hover">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Capture Fast</h3>
            <p className="text-muted-foreground leading-relaxed">
              Save ideas, links, files, or audio with zero friction. Paste, drop, or speak — we handle the rest.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border card-hover">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
              <Search className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Find Fast</h3>
            <p className="text-muted-foreground leading-relaxed">
              Semantic search understands what you mean, not just what you type. Find anything instantly.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border card-hover">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center mb-6">
              <Clock className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Apply at the Right Time</h3>
            <p className="text-muted-foreground leading-relaxed">
              Get reminded when ideas become relevant. Never let important insights slip through the cracks.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
