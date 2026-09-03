import { Skeleton } from "@/components/ui/skeleton"

export function ClubsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#17091f] via-[#0b0b12] to-black px-4 pb-24 pt-6 text-white">
      <Skeleton className="mb-4 h-5 w-16 bg-zinc-800" />
      <Skeleton className="h-8 w-28 bg-zinc-800" />
      <Skeleton className="mt-2 h-4 w-64 bg-zinc-800" />

      <Skeleton className="mt-6 h-12 w-full rounded-2xl bg-zinc-800" />

      <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950/90 p-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-3 w-16 bg-zinc-800" />
            <Skeleton className="mt-2 h-6 w-32 bg-zinc-800" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full bg-zinc-800" />
        </div>

        <Skeleton className="mt-3 h-3 w-40 bg-zinc-800" />

        <div className="mt-4 space-y-2">
          <Skeleton className="h-12 w-full rounded-xl bg-zinc-800" />
          <Skeleton className="h-12 w-full rounded-xl bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}
