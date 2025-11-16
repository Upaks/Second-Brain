import Link from "next/link"
import { Brain, Github, Twitter, Linkedin, Mail } from "lucide-react"

export function Footer() {
  const footerLinks = {
    Product: [
      { name: "Features", href: "#features" },
      { name: "Use Cases", href: "#use-cases" },
      { name: "Pricing", href: "#pricing" },
      { name: "Changelog", href: "#" },
    ],
    Company: [
      { name: "About", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Contact", href: "#" },
    ],
    Resources: [
      { name: "Documentation", href: "#" },
      { name: "API", href: "#" },
      { name: "Help Center", href: "#" },
      { name: "Community", href: "#" },
    ],
    Legal: [
      { name: "Privacy", href: "#" },
      { name: "Terms", href: "#" },
      { name: "Security", href: "#" },
      { name: "Compliance", href: "#" },
    ],
  }

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter", gradient: "from-blue-400 to-cyan-400" },
    { icon: Github, href: "#", label: "GitHub", gradient: "from-slate-400 to-slate-600" },
    { icon: Linkedin, href: "#", label: "LinkedIn", gradient: "from-blue-500 to-blue-600" },
    { icon: Mail, href: "#", label: "Email", gradient: "from-purple-400 to-pink-400" },
  ]

  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Second Brain</span>
            </Link>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">
              Your AI-powered knowledge companion. Capture, organize, and retrieve everything you learn.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social, i) => {
                const Icon = social.icon
                return (
                  <Link
                    key={i}
                    href={social.href}
                    className={`group relative p-2 rounded-lg bg-gradient-to-br ${social.gradient} opacity-60 hover:opacity-100 transition-all hover:scale-110`}
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-white mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} Second Brain. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-white/60">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
