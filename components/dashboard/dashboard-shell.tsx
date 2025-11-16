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
    <div className="flex h-screen bg-background">
      <Sidebar className="hidden lg:flex" />

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-64 border-r border-border bg-card p-0 text-foreground">
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
      <Toaster />
    </div>
  )
}
