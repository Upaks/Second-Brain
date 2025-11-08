import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { SearchInterface } from "@/components/search/search-interface"

export default async function SearchPage() {
  const user = await requireCurrentUser()

  return (
    <DashboardShell user={user}>
      <SearchInterface userId={user.id} />
    </DashboardShell>
  )
}
