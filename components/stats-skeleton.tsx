import { Skeleton } from "@/components/ui/skeleton"

export function StatsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#17091f] via-[#0b0b12] to-black px-4 pb-24 pt-6 text-white">
      <Skeleton className="mb-4 h-5 w-16 bg-zinc-800" />
      <Skeleton className="h-8 w-48 bg-zinc-800" />
      <Skeleton className="mt-2 h-4 w-40 bg-zinc-800" />

      <Skeleton className="mt-6 h-24 w-full rounded-2xl bg-zinc-800" />
      <Skeleton className="mt-6 h-40 w-full rounded-2xl bg-zinc-800" />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Skeleton className="h-20 w-full rounded-2xl bg-zinc-800" />
        <Skeleton className="h-20 w-full rounded-2xl bg-zinc-800" />
        <Skeleton className="col-span-2 h-24 w-full rounded-2xl bg-zinc-800" />
      </div>
    </div>
  )
}
