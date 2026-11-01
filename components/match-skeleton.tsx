import { Skeleton } from "@/components/ui/skeleton"

export function MatchSkeleton() {
  return (
    <div className="min-h-screen bg-black px-4 pb-24 pt-6 text-white">
      <Skeleton className="mb-4 h-5 w-16 bg-zinc-800" />

      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20 bg-zinc-800" />
        <div className="text-right">
          <Skeleton className="ml-auto h-3 w-14 bg-zinc-800" />
          <Skeleton className="ml-auto mt-1.5 h-4 w-10 bg-zinc-800" />
        </div>
      </div>

      <Skeleton className="mt-2 h-3 w-24 bg-zinc-800" />

      <div className="mt-6 flex items-center justify-between gap-2">
        <div className="flex flex-1 flex-col items-center gap-2">
          <Skeleton className="h-20 w-20 rounded-2xl bg-zinc-800" />
          <Skeleton className="h-3 w-16 bg-zinc-800" />
        </div>
        <Skeleton className="h-6 w-8 bg-zinc-800" />
        <div className="flex flex-1 flex-col items-center gap-2">
          <Skeleton className="h-20 w-20 rounded-2xl bg-zinc-800" />
          <Skeleton className="h-3 w-16 bg-zinc-800" />
        </div>
      </div>

      <Skeleton className="mt-6 h-24 w-full rounded-2xl bg-zinc-800" />
      <Skeleton className="mt-8 h-32 w-full rounded-2xl bg-zinc-800" />
    </div>
  )
}
