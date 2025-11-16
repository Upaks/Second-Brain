"use client"

import { useState } from "react"
import { ChevronDown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "How does the AI-powered search work?",
      answer:
        "Our semantic search uses advanced embeddings to understand the meaning behind your content, not just keywords. When you search, it finds related concepts, ideas, and insights even if they use different words. It's like having a research assistant that truly understands context.",
    },
    {
      question: "What file types can I upload?",
      answer:
        "You can upload text files, PDFs, Word documents, PowerPoint presentations, images (with OCR), audio files, and more. Our AI automatically extracts and processes content from all supported formats.",
    },
    {
      question: "Is my data secure and private?",
      answer:
        "Absolutely. We use enterprise-grade encryption, are SOC 2 compliant, and GDPR ready. Your data is encrypted in transit and at rest. We never use your content to train AI models, and you can export or delete your data at any time.",
    },
    {
      question: "Can I use Second Brain offline?",
      answer:
        "Currently, Second Brain requires an internet connection for AI processing and syncing. However, you can access previously synced content through our web app. Offline mode is on our roadmap.",
    },
    {
      question: "How does the spaced repetition system work?",
      answer:
        "Our AI automatically generates flashcards from your captured content. The spaced repetition algorithm schedules reviews based on proven memory science, showing you cards at optimal intervals to maximize retention. You can customize review schedules to fit your learning style.",
    },
    {
      question: "Can I share my collections with others?",
      answer:
        "Yes! Pro and Team plans allow you to create shareable collections. You can share via secure links, collaborate with team members, or make collections public. Perfect for study groups, research teams, or knowledge sharing.",
    },
    {
      question: "What happens if I cancel my subscription?",
      answer:
        "You can cancel anytime. When you cancel, you'll retain access until the end of your billing period. After that, your account will move to the Free plan, and you'll keep access to your data with Free plan limits.",
    },
    {
      question: "Do you offer student discounts?",
      answer:
        "Yes! Students with a valid .edu email address get 50% off Pro plans. Contact support with your student email to activate the discount.",
    },
  ]

  return (
    <section id="faq" className="py-32 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-6">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">FAQ</span>
          </div>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6">
            <span className="text-white">Frequently Asked</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Everything you need to know about Second Brain
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="group border-2 border-white/20 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm overflow-hidden transition-all hover:border-white/40 hover:scale-[1.02]"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-semibold text-white pr-8">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-white/60 flex-shrink-0 transition-transform",
                    openIndex === i && "rotate-180 text-white"
                  )}
                />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5 border-t border-white/10">
                  <p className="text-white/70 leading-relaxed pt-4">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
