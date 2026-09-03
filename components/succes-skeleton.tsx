import { Skeleton } from "@/components/ui/skeleton"

function AchievementCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-900 bg-black/30 p-4">
      <Skeleton className="h-14 w-14 rounded-full bg-zinc-800" />
      <Skeleton className="h-3 w-full bg-zinc-800" />
      <Skeleton className="h-3 w-2/3 bg-zinc-800" />
    </div>
  )
}

export function SuccesSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#17091f] via-[#0b0b12] to-black px-4 pb-24 pt-6 text-white">
      <Skeleton className="mb-4 h-5 w-16 bg-zinc-800" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <Skeleton className="h-8 w-28 bg-zinc-800" />
          <Skeleton className="mt-2 h-4 w-52 bg-zinc-800" />
        </div>
        <Skeleton className="h-7 w-14 rounded-full bg-zinc-800" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <AchievementCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
