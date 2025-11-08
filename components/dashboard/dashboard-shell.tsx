import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import type { User } from "@prisma/client"

interface DashboardShellProps {
  children: ReactNode
  user: User
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8 max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
