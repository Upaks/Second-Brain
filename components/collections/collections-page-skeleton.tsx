import { Skeleton } from "@/components/ui/skeleton"

export function CollectionsPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <Skeleton className="h-12 w-48 bg-white/10" />
          <Skeleton className="h-5 w-64 bg-white/10" />
        </div>
        <Skeleton className="h-10 w-40 bg-white/10" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border-2 border-white/20 bg-slate-900/95 p-6 space-y-4"
          >
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-xl bg-white/10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4 bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-2/3 bg-white/10" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="h-3 w-20 bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

