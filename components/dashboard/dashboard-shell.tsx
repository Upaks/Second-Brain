"use client"

import { useState, type ReactNode } from "react"
import { Sidebar, SidebarContent } from "./sidebar"
import { TopBar } from "./top-bar"
import type { CurrentUser } from "@/lib/session"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Toaster } from "@/components/ui/sonner"

interface DashboardShellProps {
  children: ReactNode
  user: CurrentUser
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="relative z-10 flex h-screen">
        <Sidebar className="hidden lg:flex" />

        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="w-64 border-r border-white/10 bg-slate-900/95 backdrop-blur-xl p-0 text-foreground">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <SidebarContent onNavigate={() => setIsSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar user={user} onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

          <main className="flex-1 overflow-y-auto">
            <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6">{children}</div>
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
