"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Brain, Home, Search, Inbox, Lightbulb, Folder, Clock, Layers, Settings } from "lucide-react"

interface SidebarContentProps {
  onNavigate?: () => void
}

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Search", href: "/dashboard/search", icon: Search },
  { name: "Inbox", href: "/dashboard/inbox", icon: Inbox },
  { name: "All Insights", href: "/dashboard/insights", icon: Lightbulb },
  { name: "Collections", href: "/dashboard/collections", icon: Folder },
  { name: "Flashcards", href: "/dashboard/flashcards", icon: Layers },
  { name: "Reminders", href: "/dashboard/reminders", icon: Clock },
]

function SidebarContentInner({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname()

  return (
    <>
      <div className="border-b p-6">
        <Link href="/dashboard" className="group flex items-center gap-3" onClick={onNavigate}>
          <div className="rounded-xl bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold">Second Brain</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
            pathname === "/dashboard/settings"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </div>
    </>
  )
}

export function Sidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  return (
    <aside className={cn("flex w-64 flex-col border-r bg-card", className)}>
      <SidebarContentInner onNavigate={onNavigate} />
    </aside>
  )
}

export function SidebarContent(props: SidebarContentProps) {
  return <SidebarContentInner {...props} />
}
