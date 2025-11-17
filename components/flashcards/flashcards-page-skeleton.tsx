import { Skeleton } from "@/components/ui/skeleton"

export function FlashcardsPageSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden border border-slate-900 bg-slate-950 text-slate-100 shadow-2xl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 bg-slate-950 px-6 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 bg-white/10" />
            <Skeleton className="h-3 w-48 bg-white/10" />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Skeleton className="h-7 w-20 bg-white/10" />
            <Skeleton className="h-7 w-7 rounded-full bg-white/10" />
            <Skeleton className="h-4 w-12 bg-white/10" />
            <Skeleton className="h-7 w-7 rounded-full bg-white/10" />
          </div>
          <div className="hidden md:block">
            <Skeleton className="h-9 w-32 rounded-xl bg-white/10" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 bg-white/10" />
          <Skeleton className="h-9 w-24 bg-white/10" />
          <Skeleton className="h-9 w-9 rounded-lg bg-white/10" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="relative h-64 rounded-xl border-2 border-white/20 bg-slate-900/95 p-6"
              >
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4 bg-white/10" />
                  <Skeleton className="h-4 w-full bg-white/10" />
                  <Skeleton className="h-4 w-5/6 bg-white/10" />
                  <div className="pt-4 space-y-2">
                    <Skeleton className="h-3 w-full bg-white/10" />
                    <Skeleton className="h-3 w-4/5 bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

