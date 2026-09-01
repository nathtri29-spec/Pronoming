import { Skeleton } from "@/components/ui/skeleton"

function PlayerRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-950/90 p-4">
      <Skeleton className="h-6 w-6 bg-zinc-800" />
      <Skeleton className="h-13 w-13 shrink-0 rounded-full bg-zinc-800" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-28 bg-zinc-800" />
        <Skeleton className="mt-2 h-3 w-20 bg-zinc-800" />
      </div>
      <Skeleton className="h-5 w-10 bg-zinc-800" />
    </div>
  )
}

export function LeaderboardSkeleton() {
  return (
    <div className="min-h-screen bg-black px-4 pb-24 pt-6 text-white">
      <Skeleton className="h-8 w-52 bg-zinc-800" />
      <Skeleton className="mt-2 h-4 w-64 bg-zinc-800" />

      <section className="relative mt-6 overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 text-center">
        <Skeleton className="mx-auto h-3 w-16 bg-zinc-800" />
        <Skeleton className="mx-auto mt-5 h-32 w-32 rounded-full bg-zinc-800" />
        <Skeleton className="mx-auto mt-5 h-9 w-40 bg-zinc-800" />
        <Skeleton className="mx-auto mt-3 h-7 w-24 bg-zinc-800" />
        <Skeleton className="mx-auto mt-2 h-3 w-48 bg-zinc-800" />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl bg-white/5" />
          <Skeleton className="h-24 rounded-2xl bg-white/5" />
        </div>

        <Skeleton className="mx-auto mt-5 h-3 rounded-full bg-zinc-800" />
      </section>

      <Skeleton className="mt-6 h-12 rounded-2xl bg-zinc-800" />

      <div className="mt-6 flex items-center justify-between">
        <Skeleton className="h-5 w-32 bg-zinc-800" />
        <Skeleton className="h-6 w-16 rounded-full bg-zinc-800" />
      </div>

      <div className="mt-4 space-y-3">
        <PlayerRowSkeleton />
        <PlayerRowSkeleton />
        <PlayerRowSkeleton />
        <PlayerRowSkeleton />
        <PlayerRowSkeleton />
      </div>
    </div>
  )
}
