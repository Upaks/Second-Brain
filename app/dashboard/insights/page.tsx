import { Suspense } from "react"

import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InsightsStreamSection } from "@/components/insights/insights-stream-section"
import { InsightsPageSkeleton } from "@/components/insights/insights-page-skeleton"

type InsightsPageSearchParams = {
  tag?: string
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<InsightsPageSearchParams>
}) {
  const user = await requireCurrentUser()
  const params = await searchParams
  const selectedTag = params?.tag

  return (
    <DashboardShell user={user}>
      <Suspense fallback={<InsightsPageSkeleton />}>
        <InsightsStreamSection userId={user.id} selectedTag={selectedTag} />
      </Suspense>
    </DashboardShell>
  )
}
