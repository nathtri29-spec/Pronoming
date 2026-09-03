import { Skeleton } from "@/components/ui/skeleton"

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/90 p-3">
      <Skeleton className="h-11 w-11 shrink-0 rounded-full bg-zinc-800" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-28 bg-zinc-800" />
        <Skeleton className="mt-1.5 h-3 w-16 bg-zinc-800" />
      </div>
      <Skeleton className="h-7 w-16 shrink-0 rounded-lg bg-zinc-800" />
    </div>
  )
}

export function FriendsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#17091f] via-[#0b0b12] to-black px-4 pb-24 pt-6 text-white">
      <Skeleton className="mb-4 h-5 w-16 bg-zinc-800" />
      <Skeleton className="h-8 w-24 bg-zinc-800" />
      <Skeleton className="mt-2 h-4 w-56 bg-zinc-800" />

      <Skeleton className="mt-5 h-12 w-full rounded-xl bg-zinc-800" />

      <div className="mt-6">
        <Skeleton className="mb-3 h-3 w-32 bg-zinc-800" />
        <div className="space-y-2.5">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      </div>
    </div>
  )
}
