"use client"

import { useState, type ReactNode } from "react"
import { Sidebar, SidebarContent } from "./sidebar"
import { TopBar } from "./top-bar"
import type { User } from "@prisma/client"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface DashboardShellProps {
  children: ReactNode
  user: User
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar className="hidden lg:flex" />

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-64 border-r border-border bg-card p-0 text-foreground">
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
  )
}
