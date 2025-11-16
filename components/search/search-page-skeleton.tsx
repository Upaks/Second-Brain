import { Skeleton } from "@/components/ui/skeleton"

export function SearchPageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-12 w-32 mb-3 bg-white/10" />
        <Skeleton className="h-5 w-64 bg-white/10" />
      </div>

      <form className="max-w-3xl">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Skeleton className="h-14 w-full rounded-md bg-white/10" />
          </div>
          <Skeleton className="h-14 w-32 rounded-md bg-white/10" />
        </div>
      </form>

      <div className="max-w-5xl">
        <div className="rounded-2xl border-2 border-white/20 bg-slate-900/50 p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-2xl bg-white/10" />
            <Skeleton className="h-6 w-48 bg-white/10" />
            <Skeleton className="h-4 w-64 bg-white/10" />
            <div className="mt-6 space-y-2 w-full max-w-md">
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-3/4 bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

