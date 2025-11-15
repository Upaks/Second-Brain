import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InsightsPageClient } from "@/components/insights/insights-page-client"
import { getAvailableTags, getInsightsGrid } from "@/lib/data/dashboard"

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

  const [insights, tags] = await Promise.all([getInsightsGrid(user.id, selectedTag), getAvailableTags(user.id)])

  return (
    <DashboardShell user={user}>
      <InsightsPageClient initialInsights={insights} tags={tags} selectedTag={selectedTag} />
    </DashboardShell>
  )
}
