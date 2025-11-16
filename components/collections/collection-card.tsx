import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Folder, FileText } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
type CollectionSummary = {
  id: string
  name: string
  description: string | null
  color: string | null
  updatedAt: Date
  insightCount: number
}

interface CollectionCardProps {
  collection: CollectionSummary
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={`/dashboard/collections/${collection.id}`}>
      <Card className="p-6 h-full hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group border-2 border-white/20 bg-slate-900/95 backdrop-blur-sm hover:border-white/40">
        <div className="flex flex-col h-full space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10">
              <Folder className="h-6 w-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                {collection.name}
              </h3>
              {collection.description && (
                <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">{collection.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <FileText className="h-4 w-4" />
              {collection.insightCount} {collection.insightCount === 1 ? "insight" : "insights"}
            </div>

            <div className="text-xs text-white/60">
              {formatDistanceToNow(new Date(collection.updatedAt), { addSuffix: true })}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
