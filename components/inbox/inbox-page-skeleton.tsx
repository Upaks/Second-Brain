import { Skeleton } from "@/components/ui/skeleton"

export function InboxPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-12 w-32 bg-white/10" />
          <Skeleton className="h-5 w-64 bg-white/10" />
        </div>
        <Skeleton className="h-9 w-36 bg-white/10" />
      </div>

      <div className="space-y-8">
        {/* Processing section skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-40 bg-white/10" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="rounded-2xl border-2 border-white/20 bg-slate-900/95 p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-11 w-11 rounded-xl bg-white/10" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-3/4 bg-white/10" />
                    <Skeleton className="h-4 w-full bg-white/10" />
                    <Skeleton className="h-4 w-2/3 bg-white/10" />
                    <div className="flex items-center gap-2 pt-4">
                      <Skeleton className="h-5 w-16 rounded-full bg-white/10" />
                      <Skeleton className="h-5 w-20 rounded-full bg-white/10" />
                      <Skeleton className="h-4 w-24 ml-auto bg-white/10" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-24 rounded-full bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently processed section skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48 bg-white/10" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border-2 border-white/20 bg-slate-900/95 p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-11 w-11 rounded-xl bg-white/10" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-3/4 bg-white/10" />
                    <Skeleton className="h-4 w-full bg-white/10" />
                    <Skeleton className="h-4 w-2/3 bg-white/10" />
                    <div className="flex items-center gap-2 pt-4">
                      <Skeleton className="h-5 w-16 rounded-full bg-white/10" />
                      <Skeleton className="h-5 w-20 rounded-full bg-white/10" />
                      <Skeleton className="h-4 w-24 ml-auto bg-white/10" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-20 rounded-full bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

