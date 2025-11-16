import { CheckCircle2, Shield, Lock, Award } from "lucide-react"

export function SocialProofSection() {
  const logos = [
    { name: "TechCorp", placeholder: "TC", gradient: "from-blue-500 to-cyan-500" },
    { name: "EduTech", placeholder: "ET", gradient: "from-purple-500 to-pink-500" },
    { name: "Research Labs", placeholder: "RL", gradient: "from-orange-500 to-red-500" },
    { name: "Innovate Co", placeholder: "IC", gradient: "from-green-500 to-emerald-500" },
    { name: "StudyHub", placeholder: "SH", gradient: "from-pink-500 to-rose-500" },
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-white/60 mb-6 uppercase tracking-wider">Trusted by teams at</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-16">
          {logos.map((logo, i) => (
            <div
              key={i}
              className="group relative flex items-center justify-center w-40 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 text-white font-bold text-lg hover:scale-110 hover:border-white/40 transition-all cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${logo.gradient} opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity`} />
              <span className="relative z-10">{logo.placeholder}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-sm">
            <Shield className="h-5 w-5 text-green-400" />
            <span className="text-sm font-semibold text-white">SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 backdrop-blur-sm">
            <Lock className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-semibold text-white">GDPR Ready</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 backdrop-blur-sm">
            <Award className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-semibold text-white">Enterprise Security</span>
          </div>
        </div>
      </div>
    </section>
  )
}
