import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight, Sparkles, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function PricingSection() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "100 captures per month",
        "Basic AI insights",
        "Semantic search",
        "5 collections",
        "Community support",
      ],
      cta: "Get Started",
      popular: false,
      gradient: "from-slate-500 to-slate-600",
      bgGradient: "from-slate-500/20 to-slate-600/20",
    },
    {
      name: "Pro",
      price: "$12",
      period: "per month",
      description: "For serious learners and professionals",
      features: [
        "Unlimited captures",
        "Advanced AI insights",
        "Priority processing",
        "Unlimited collections",
        "Spaced repetition flashcards",
        "Smart reminders",
        "Export & sharing",
        "Email support",
      ],
      cta: "Start Free Trial",
      popular: true,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      name: "Team",
      price: "$29",
      period: "per user/month",
      description: "For teams and organizations",
      features: [
        "Everything in Pro",
        "Team workspaces",
        "Shared collections",
        "Admin controls",
        "SSO integration",
        "Advanced analytics",
        "Priority support",
        "Custom integrations",
      ],
      cta: "Contact Sales",
      popular: false,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/20 to-cyan-500/20",
    },
  ]

  return (
    <section id="pricing" className="py-32 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-6">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">Pricing</span>
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6">
            <span className="text-white">Simple,</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <Card
              key={i}
              className={`group relative overflow-visible border-2 ${
                plan.popular
                  ? "border-purple-500/50 shadow-2xl shadow-purple-500/20 scale-105 pt-6"
                  : "border-white/20"
              } bg-slate-900/95 backdrop-blur-md hover:scale-105 transition-all duration-300 hover:shadow-2xl`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 z-20">
                  <Zap className="h-3 w-3" />
                  Most Popular
                </div>
              )}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.bgGradient} opacity-30`} />
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <CardHeader className="text-center pb-8 relative z-10">
                <CardTitle className="text-2xl font-bold text-white mb-2">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-slate-200">/{plan.period}</span>
                </div>
                <CardDescription className="text-base text-slate-100">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-100 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-6 h-12 font-semibold ${
                    plan.popular
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50"
                      : "bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                  } hover:scale-105 transition-all`}
                  size="lg"
                  asChild
                >
                  <Link href={plan.name === "Team" ? "mailto:sales@secondbrain.com" : "/auth/signup"}>
                    {plan.cta}
                    {plan.name !== "Team" && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-white/60">
            All plans include a 14-day free trial. No credit card required.{" "}
            <Link href="#faq" className="text-purple-400 hover:text-purple-300 underline">
              See FAQ
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
