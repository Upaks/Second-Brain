import { Suspense } from "react"

import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { CollectionsStreamSection } from "@/components/collections/collections-stream-section"
import { CollectionsPageSkeleton } from "@/components/collections/collections-page-skeleton"

export default async function CollectionsPage() {
  const user = await requireCurrentUser()

  return (
    <DashboardShell user={user}>
      <Suspense fallback={<CollectionsPageSkeleton />}>
        <CollectionsStreamSection userId={user.id} />
      </Suspense>
    </DashboardShell>
  )
}
