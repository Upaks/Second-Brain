import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { CaptureComposer } from "@/components/capture/capture-composer"
import { RecentInsightsClient } from "@/components/insights/recent-insights-client"
import { getRecentInsights } from "@/lib/data/dashboard"

export default async function DashboardPage() {
  const user = await requireCurrentUser()

  const insights = await getRecentInsights(user.id)

  return (
    <DashboardShell user={user}>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3 text-white">
            Capture
          </h1>
          <p className="text-white/70 text-lg">
            Save ideas, links, files, or audio — we&apos;ll turn them into insights
          </p>
        </div>

        <CaptureComposer />

        <div className="pt-8">
          <h2 className="text-2xl font-bold mb-6 text-white">Recent Insights</h2>
          <RecentInsightsClient initialInsights={insights} userId={user.id} />
        </div>
      </div>
    </DashboardShell>
  )
}
