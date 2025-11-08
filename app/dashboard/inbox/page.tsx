import { requireCurrentUser } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InboxList } from "@/components/inbox/inbox-list"
import { prisma } from "@/lib/db"

export default async function InboxPage() {
  const user = await requireCurrentUser()

  // Get pending and recently processed items
  const ingestItems = await prisma.ingestItem.findMany({
    where: {
      userId: user.id,
      status: {
        in: ["PENDING", "PROCESSING", "DONE"],
      },
    },
    include: {
      insight: {
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <DashboardShell user={user}>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Inbox</h1>
          <p className="text-muted-foreground text-lg">Recent captures and processing status</p>
        </div>

        <InboxList items={ingestItems} />
      </div>
    </DashboardShell>
  )
}
