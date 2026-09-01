import { Skeleton } from "@/components/ui/skeleton"

function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
      <Skeleton className="h-10 w-10 shrink-0 rounded-lg bg-zinc-800" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3 w-14 bg-zinc-800" />
        <Skeleton className="mt-2 h-5 w-10 bg-zinc-800" />
      </div>
    </div>
  )
}

function HistoryRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full bg-zinc-800" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-40 bg-zinc-800" />
        <Skeleton className="mt-2 h-3 w-24 bg-zinc-800" />
      </div>
      <Skeleton className="h-4 w-14 shrink-0 bg-zinc-800" />
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#17091f] via-[#0b0b12] to-black p-6 pb-24 text-white">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-28 bg-zinc-800" />
          <Skeleton className="mt-2 h-4 w-36 bg-zinc-800" />
        </div>
        <Skeleton className="h-9 w-9 rounded-lg bg-zinc-800" />
      </div>

      <div className="p-6 text-center">
        <Skeleton className="mx-auto mb-4 h-24 w-24 rounded-full bg-zinc-800" />
        <Skeleton className="mx-auto h-7 w-32 bg-zinc-800" />

        <div className="mt-3 flex items-center justify-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full bg-zinc-800" />
          <Skeleton className="h-4 w-16 bg-zinc-800" />
        </div>

        <Skeleton className="mx-auto mt-3 h-10 w-40 rounded-full bg-zinc-800" />

        <div className="mt-3 flex justify-center gap-2">
          <Skeleton className="h-6 w-16 rounded-full bg-zinc-800" />
          <Skeleton className="h-6 w-20 rounded-full bg-zinc-800" />
          <Skeleton className="h-6 w-14 rounded-full bg-zinc-800" />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between">
            <Skeleton className="h-3 w-16 bg-zinc-800" />
            <Skeleton className="h-3 w-20 bg-zinc-800" />
          </div>
          <Skeleton className="h-2 w-full rounded-full bg-zinc-800" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-44 bg-zinc-800" />
          <Skeleton className="h-3 w-14 bg-zinc-800" />
        </div>

        <div className="space-y-2">
          <HistoryRowSkeleton />
          <HistoryRowSkeleton />
          <HistoryRowSkeleton />
          <HistoryRowSkeleton />
          <HistoryRowSkeleton />
        </div>
      </div>
    </div>
  )
}
