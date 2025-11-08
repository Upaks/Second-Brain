import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default async function SettingsPage() {
  const user = await requireCurrentUser()

  return (
    <DashboardShell user={user}>
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground text-lg">Manage your account and preferences</p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Account Information</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue={user.name || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user.email} disabled />
            </div>

            <p className="text-sm text-muted-foreground">
              Account settings are currently read-only. Full profile editing coming soon.
            </p>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}
