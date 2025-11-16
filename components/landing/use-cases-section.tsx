import { BookOpen, Target, Users, Rocket, GraduationCap, Briefcase, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function UseCasesSection() {
  const useCases = [
    {
      icon: GraduationCap,
      title: "Students & Researchers",
      description: "Organize research papers, lecture notes, and study materials. Generate flashcards automatically and ace your exams.",
      features: ["Research organization", "Auto flashcards", "Citation management"],
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
    },
    {
      icon: Briefcase,
      title: "Professionals & Teams",
      description: "Capture meeting notes, project insights, and industry knowledge. Build a searchable knowledge base for your organization.",
      features: ["Meeting notes", "Team collaboration", "Knowledge sharing"],
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
    },
    {
      icon: Rocket,
      title: "Content Creators",
      description: "Never lose an idea. Capture inspiration from anywhere, organize content plans, and build a library of reference materials.",
      features: ["Idea capture", "Content planning", "Reference library"],
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-500/20 to-red-500/20",
      borderColor: "border-orange-500/30",
    },
    {
      icon: Target,
      title: "Lifelong Learners",
      description: "Build your personal knowledge base. Learn from courses, books, podcasts, and articles. Connect ideas across domains.",
      features: ["Multi-source learning", "Idea connections", "Long-term retention"],
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
    },
  ]

  return (
    <section id="use-cases" className="py-32 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-6">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">Use Cases</span>
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6">
            <span className="text-white">Built for</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Every Learner
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Whether you're a student, professional, or lifelong learner, Second Brain adapts to your workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {useCases.map((useCase, i) => {
            const Icon = useCase.icon
            return (
              <Card
                key={i}
                className={`group relative overflow-hidden border-2 ${useCase.borderColor} bg-slate-900/95 backdrop-blur-md hover:scale-105 transition-all duration-300 hover:shadow-2xl cursor-pointer`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${useCase.bgGradient} opacity-30`} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative z-10">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${useCase.gradient} mb-6 shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mb-3">{useCase.title}</CardTitle>
                  <CardDescription className="text-base text-slate-100">{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ul className="space-y-3">
                    {useCase.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm">
                        <div className={`h-2 w-2 rounded-full bg-gradient-to-br ${useCase.gradient}`} />
                        <span className="text-slate-100 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
