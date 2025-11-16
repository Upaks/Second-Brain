import { Search, Zap, Clock, Layers, Folder, Shield, Sparkles, FileText, LinkIcon, ImageIcon, Music, Brain, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export function FeaturesSection() {
  const mainFeatures = [
    {
      icon: Zap,
      title: "Lightning-Fast Capture",
      description: "Save ideas in seconds. Paste text, drop files, add URLs, or upload audio. Our AI processes everything automatically.",
      color: "from-yellow-400 to-orange-500",
      bgColor: "from-yellow-500/20 to-orange-500/20",
      borderColor: "border-yellow-500/30",
    },
    {
      icon: Search,
      title: "Semantic Search",
      description: "Find anything instantly with AI-powered search that understands meaning, not just keywords. Your knowledge at your fingertips.",
      color: "from-blue-400 to-cyan-500",
      bgColor: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Automatically extract key insights, summarize content, and generate smart tags. Turn information into actionable knowledge.",
      color: "from-purple-400 to-pink-500",
      bgColor: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
    },
    {
      icon: Clock,
      title: "Smart Reminders",
      description: "Never forget important ideas. Set contextual reminders that surface insights when they become relevant to your work.",
      color: "from-green-400 to-emerald-500",
      bgColor: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
    },
    {
      icon: Layers,
      title: "Spaced Repetition",
      description: "Master knowledge with AI-generated flashcards using proven spaced repetition algorithms. Study smarter, not harder.",
      color: "from-orange-400 to-red-500",
      bgColor: "from-orange-500/20 to-red-500/20",
      borderColor: "border-orange-500/30",
    },
    {
      icon: Folder,
      title: "Smart Collections",
      description: "Organize insights into collections. Share curated knowledge with teams or keep private research organized.",
      color: "from-pink-400 to-rose-500",
      bgColor: "from-pink-500/20 to-rose-500/20",
      borderColor: "border-pink-500/30",
    },
  ]

  const captureTypes = [
    { icon: FileText, label: "Text & Notes", color: "from-blue-500 to-cyan-500" },
    { icon: LinkIcon, label: "URLs & Links", color: "from-purple-500 to-pink-500" },
    { icon: FileText, label: "PDFs & Docs", color: "from-orange-500 to-red-500" },
    { icon: ImageIcon, label: "Images & OCR", color: "from-green-500 to-emerald-500" },
    { icon: Music, label: "Audio & Voice", color: "from-pink-500 to-rose-500" },
  ]

  return (
    <section id="features" className="py-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-6">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">Powerful Features</span>
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6">
            <span className="text-white">Everything you need to</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              build your knowledge base
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Capture, organize, and retrieve knowledge with AI-powered tools designed for modern professionals.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {mainFeatures.map((feature, i) => {
            const Icon = feature.icon
            return (
              <Card
                key={i}
                className={`group relative overflow-hidden border-2 ${feature.borderColor} bg-slate-900/95 backdrop-blur-md hover:scale-105 transition-all duration-300 hover:shadow-2xl cursor-pointer`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} opacity-30`} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-8 relative z-10">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-100 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Capture Types */}
        <div className="relative rounded-3xl border-2 border-white/20 bg-slate-900/95 backdrop-blur-2xl p-12 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20" />
          <div className="relative z-10">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-white mb-3">Capture Anything</h3>
              <p className="text-slate-100 text-lg">Support for all your content types</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {captureTypes.map((type, i) => {
                const Icon = type.icon
                return (
                  <div
                    key={i}
                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-110 transition-all cursor-pointer"
                  >
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${type.color} shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-white">{type.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
