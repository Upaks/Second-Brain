import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { CaptureComposer } from "@/components/capture/capture-composer"
import { InsightList } from "@/components/insights/insight-list"
import { getRecentInsights } from "@/lib/data/dashboard"

export default async function DashboardPage() {
  const user = await requireCurrentUser()

  const insights = await getRecentInsights(user.id)

  return (
    <DashboardShell user={user}>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Capture</h1>
          <p className="text-muted-foreground text-lg">
            Save ideas, links, files, or audio — we&apos;ll turn them into insights
          </p>
        </div>

        <CaptureComposer userId={user.id} />

        <div className="pt-8">
          <h2 className="text-2xl font-semibold mb-6">Recent Insights</h2>
          <InsightList insights={insights} />
        </div>
      </div>
    </DashboardShell>
  )
}
