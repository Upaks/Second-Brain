import { Star, Quote, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "PhD Student, Computer Science",
      content: "Second Brain transformed how I organize my research. The AI-powered search finds connections I never would have noticed. It's like having a research assistant that never sleeps.",
      rating: 5,
      avatar: "SC",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      name: "Marcus Johnson",
      role: "Product Manager",
      content: "I capture ideas from meetings, articles, and conversations throughout the day. The smart reminders surface insights exactly when I need them for product planning. Game changer.",
      rating: 5,
      avatar: "MJ",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      name: "Emily Rodriguez",
      role: "Content Creator",
      content: "As a creator, I'm constantly consuming content for inspiration. Second Brain helps me capture and organize everything, then find it instantly when I'm working on new projects.",
      rating: 5,
      avatar: "ER",
      gradient: "from-orange-500 to-red-500",
    },
    {
      name: "David Kim",
      role: "Medical Student",
      content: "The spaced repetition flashcards are incredible. I upload my lecture notes and textbooks, and the AI creates perfect study cards. My exam scores improved significantly.",
      rating: 5,
      avatar: "DK",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      name: "Lisa Wang",
      role: "Consultant",
      content: "I use Second Brain to build knowledge bases for each client project. The collections feature makes it easy to organize and share insights with my team. Highly recommend.",
      rating: 5,
      avatar: "LW",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      name: "James Taylor",
      role: "Entrepreneur",
      content: "I've tried every note-taking app. Second Brain is the first one that actually helps me retrieve information when I need it. The semantic search is mind-blowing.",
      rating: 5,
      avatar: "JT",
      gradient: "from-violet-500 to-purple-500",
    },
  ]

  return (
    <section className="py-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-6">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">Testimonials</span>
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6">
            <span className="text-white">Loved by</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Knowledge Workers
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            See what our users are saying about Second Brain
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <Card
              key={i}
              className="group relative overflow-hidden border-2 border-white/20 bg-slate-900/95 backdrop-blur-md hover:scale-105 hover:border-white/40 transition-all duration-300 hover:shadow-2xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-white/20 mb-4" />
                <p className="text-slate-100 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-sm font-bold text-white shadow-lg`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-slate-200">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
