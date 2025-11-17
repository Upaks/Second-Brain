import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SubscriptionManager } from "@/components/dashboard/subscription-manager"
import { getUserSubscription } from "@/lib/subscription"
import { CheckoutStatusMessage } from "@/components/dashboard/checkout-status-message"

type SettingsPageSearchParams = {
  success?: string
  canceled?: string
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<SettingsPageSearchParams>
}) {
  const user = await requireCurrentUser()
  const subscription = await getUserSubscription(user.id)
  const params = await searchParams

  return (
    <DashboardShell user={user}>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-slate-300 text-lg">Manage your account and preferences</p>
        </div>

        <CheckoutStatusMessage success={params?.success} canceled={params?.canceled} />

        <SubscriptionManager
          subscription={
            subscription
              ? {
                  id: subscription.id,
                  plan: subscription.plan,
                  status: subscription.status,
                  stripeCurrentPeriodEnd: subscription.stripeCurrentPeriodEnd,
                  cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                }
              : null
          }
        />

        <Card className="p-8 bg-slate-900/50 backdrop-blur-xl border-slate-800/50 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white">Account Information</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200 font-medium">
                Name
              </Label>
              <Input
                id="name"
                defaultValue={user.name || ""}
                disabled
                className="h-12 bg-slate-800/50 border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20 disabled:opacity-60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                defaultValue={user.email}
                disabled
                className="h-12 bg-slate-800/50 border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20 disabled:opacity-60"
              />
            </div>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              Account settings are currently read-only. Full profile editing coming soon.
            </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}
