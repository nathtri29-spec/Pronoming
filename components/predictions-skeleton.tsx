import { Skeleton } from "@/components/ui/skeleton"

function PredictionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-purple-400/20 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <Skeleton className="h-4 w-40 bg-zinc-800" />
          <Skeleton className="mt-2 h-3 w-24 bg-zinc-800" />
        </div>
        <Skeleton className="h-4 w-16 bg-zinc-800" />
      </div>

      <div className="flex justify-between">
        <Skeleton className="h-3 w-20 bg-zinc-800" />
        <Skeleton className="h-3 w-16 bg-zinc-800" />
      </div>

      <Skeleton className="mt-3 h-4 w-16 bg-zinc-800" />
    </div>
  )
}

export function PredictionsSkeleton() {
  return (
    <div className="min-h-screen bg-black p-6 pb-24 text-white">
      <Skeleton className="h-9 w-52 bg-zinc-800" />
      <Skeleton className="mb-8 mt-2 h-4 w-40 bg-zinc-800" />

      <div className="my-6 h-px w-full bg-white/10" />

      <div className="mb-6 flex flex-wrap gap-2">
        <Skeleton className="h-9 w-16 rounded-full bg-zinc-800" />
        <Skeleton className="h-9 w-24 rounded-full bg-zinc-800" />
        <Skeleton className="h-9 w-20 rounded-full bg-zinc-800" />
        <Skeleton className="h-9 w-20 rounded-full bg-zinc-800" />
      </div>

      <div className="space-y-3">
        <PredictionCardSkeleton />
        <PredictionCardSkeleton />
        <PredictionCardSkeleton />
        <PredictionCardSkeleton />
      </div>
    </div>
  )
}
