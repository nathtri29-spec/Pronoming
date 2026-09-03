import { Skeleton } from "@/components/ui/skeleton"

export function PersonnalisationSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#17091f] via-[#0b0b12] to-black px-4 pb-24 pt-6 text-white">
      <Skeleton className="mb-4 h-5 w-16 bg-zinc-800" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <Skeleton className="h-8 w-56 bg-zinc-800" />
          <Skeleton className="mt-2 h-4 w-64 bg-zinc-800" />
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <Skeleton className="h-14 w-14 rounded-full bg-zinc-800" />
          <Skeleton className="h-5 w-16 rounded-full bg-zinc-800" />
        </div>
      </div>

      <div className="mt-8">
        <Skeleton className="mb-4 h-3 w-16 bg-zinc-800" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 rounded-2xl border border-transparent p-3">
              <Skeleton className="h-[60px] w-[60px] rounded-full bg-zinc-800" />
              <Skeleton className="h-2.5 w-10 bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <Skeleton className="mb-4 h-3 w-14 bg-zinc-800" />
        <div className="space-y-2.5">
          <Skeleton className="h-16 w-full rounded-xl bg-zinc-800" />
          <Skeleton className="h-16 w-full rounded-xl bg-zinc-800" />
          <Skeleton className="h-16 w-full rounded-xl bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}
