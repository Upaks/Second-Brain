import { Suspense } from "react"

import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { FlashcardsStreamSection } from "@/components/flashcards/flashcards-stream-section"
import { FlashcardsPageSkeleton } from "@/components/flashcards/flashcards-page-skeleton"

export default async function FlashcardsPage() {
  const user = await requireCurrentUser()

  return (
    <DashboardShell user={user}>
      <Suspense fallback={<FlashcardsPageSkeleton />}>
        <FlashcardsStreamSection userId={user.id} />
      </Suspense>
    </DashboardShell>
  )
}

