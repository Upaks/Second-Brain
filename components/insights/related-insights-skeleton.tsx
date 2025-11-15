import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function RelatedInsightsSkeleton() {
  return (
    <Card className="p-6 space-y-4">
      <Skeleton className="h-5 w-48" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="p-4 rounded-lg border space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

