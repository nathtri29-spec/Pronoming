import { Skeleton } from "@/components/ui/skeleton"

function MatchCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#08080d] p-4">
      <div className="mb-4 flex items-start justify-between">
        <Skeleton className="h-3 w-20 bg-zinc-800" />
        <div className="text-right">
          <Skeleton className="ml-auto h-3 w-14 bg-zinc-800" />
          <Skeleton className="ml-auto mt-1.5 h-4 w-10 bg-zinc-800" />
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <div className="flex flex-1 flex-col items-center gap-2">
          <Skeleton className="h-14 w-14 rounded-xl bg-zinc-800" />
          <Skeleton className="h-3 w-16 bg-zinc-800" />
        </div>

        <Skeleton className="h-6 w-8 bg-zinc-800" />

        <div className="flex flex-1 flex-col items-center gap-2">
          <Skeleton className="h-14 w-14 rounded-xl bg-zinc-800" />
          <Skeleton className="h-3 w-16 bg-zinc-800" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-xl bg-zinc-800" />
        <Skeleton className="h-16 rounded-xl bg-zinc-800" />
      </div>
    </div>
  )
}

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-black pb-24 text-white">
      <div className="border-b border-zinc-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-36 bg-zinc-800" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-full bg-zinc-800" />
            <Skeleton className="h-9 w-16 rounded-lg bg-zinc-800" />
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between">
            <Skeleton className="h-3 w-24 bg-zinc-800" />
            <Skeleton className="h-3 w-12 bg-zinc-800" />
          </div>
          <Skeleton className="h-2 w-full rounded-full bg-zinc-800" />
        </div>
      </div>

      <main className="px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-40 bg-zinc-800" />
          <Skeleton className="h-3 w-24 bg-zinc-800" />
        </div>

        <div className="space-y-4">
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </div>
      </main>
    </div>
  )
}
