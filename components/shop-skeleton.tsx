import { Skeleton } from "@/components/ui/skeleton"

function TitleCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/40 p-3">
      <Skeleton className="h-4 w-24 bg-zinc-800" />
      <Skeleton className="mt-2 h-8 w-full bg-zinc-800" />
      <Skeleton className="mt-3 h-4 w-14 bg-zinc-800" />
      <Skeleton className="mt-3 h-8 w-full rounded-lg bg-zinc-800" />
    </div>
  )
}

export function ShopSkeleton() {
  return (
    <div className="min-h-screen bg-black p-6 pb-24 text-white">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-28 bg-zinc-800" />
          <Skeleton className="mt-2 h-4 w-48 bg-zinc-800" />
        </div>
        <Skeleton className="h-9 w-20 rounded-full bg-zinc-800" />
      </div>

      <div className="my-6 h-px w-full bg-white/10" />

      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-4">
        <div className="mb-4">
          <Skeleton className="h-6 w-20 bg-zinc-800" />
          <Skeleton className="mt-2 h-3 w-40 bg-zinc-800" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TitleCardSkeleton />
          <TitleCardSkeleton />
          <TitleCardSkeleton />
          <TitleCardSkeleton />
          <TitleCardSkeleton />
          <TitleCardSkeleton />
        </div>
      </div>
    </div>
  )
}
