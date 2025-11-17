import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Brain,
  Search,
  Lightbulb,
  Clock,
  Layers,
  Folder,
  CheckCircle2,
  Sparkles,
  Zap,
  Shield,
  Globe,
  Users,
  FileText,
  LinkIcon,
  ImageIcon,
  Music,
  Star,
  ChevronDown,
  Play,
  TrendingUp,
  BookOpen,
  Target,
  Rocket,
} from "lucide-react"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { SocialProofSection } from "@/components/landing/social-proof-section"
import { UseCasesSection } from "@/components/landing/use-cases-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { FAQSection } from "@/components/landing/faq-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Brain className="h-5 w-5 text-white" />
            </div>
              <span className="text-lg font-bold text-white">Second Brain</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#use-cases" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Use Cases
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="#faq" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                FAQ
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Social Proof */}
      <SocialProofSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Use Cases Section */}
      <UseCasesSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  )
}
