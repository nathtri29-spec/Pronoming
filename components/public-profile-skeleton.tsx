import { Skeleton } from "@/components/ui/skeleton"

function StatCardSkeleton() {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950 p-4">
      <Skeleton className="mb-3 h-5 w-5 bg-zinc-800" />
      <Skeleton className="h-3 w-16 bg-zinc-800" />
      <Skeleton className="mt-2 h-7 w-10 bg-zinc-800" />
    </div>
  )
}

function PredictionRowSkeleton() {
  return (
    <div className="flex items-center justify-between border-b border-white/10 p-4 last:border-b-0">
      <div>
        <Skeleton className="h-4 w-28 bg-zinc-800" />
        <Skeleton className="mt-1.5 h-3 w-20 bg-zinc-800" />
      </div>
      <Skeleton className="h-4 w-14 bg-zinc-800" />
    </div>
  )
}

export function PublicProfileSkeleton() {
  return (
    <div className="min-h-screen bg-black px-4 pb-24 pt-6 text-white">
      <Skeleton className="h-5 w-16 bg-zinc-800" />

      <section className="relative mt-6 overflow-hidden rounded-[36px] border border-purple-500/40 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-6">
        <div className="flex flex-col items-center">
          <Skeleton className="h-24 w-24 rounded-full bg-zinc-800" />
          <Skeleton className="mt-4 h-8 w-32 bg-zinc-800" />

          <div className="mt-3 flex items-center gap-3">
            <Skeleton className="h-8 w-24 rounded-full bg-zinc-800" />
            <Skeleton className="h-8 w-20 rounded-full bg-zinc-800" />
          </div>

          <Skeleton className="mt-5 h-20 w-full max-w-xs rounded-2xl bg-zinc-800" />
          <Skeleton className="mt-4 h-24 w-full rounded-[24px] bg-zinc-800" />
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="mt-8">
        <Skeleton className="mb-3 h-6 w-40 bg-zinc-800" />
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
          <PredictionRowSkeleton />
          <PredictionRowSkeleton />
          <PredictionRowSkeleton />
        </div>
      </div>
    </div>
  )
}
