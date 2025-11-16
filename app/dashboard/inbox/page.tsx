import { Suspense } from "react"

import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InboxStreamSection } from "@/components/inbox/inbox-stream-section"
import { InboxPageSkeleton } from "@/components/inbox/inbox-page-skeleton"

export default async function InboxPage() {
  const user = await requireCurrentUser()

  return (
    <DashboardShell user={user}>
      <Suspense fallback={<InboxPageSkeleton />}>
        <InboxStreamSection userId={user.id} />
      </Suspense>
    </DashboardShell>
  )
}
