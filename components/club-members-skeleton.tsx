import { Skeleton } from "@/components/ui/skeleton"

export function ClubMembersSkeleton() {
  return (
    <div className="min-h-screen px-4 pb-24 pt-6 text-white" style={{ background: "#0f001e" }}>
      <Skeleton className="mb-4 h-5 w-16 bg-zinc-800" />
      <Skeleton className="h-7 w-40 bg-zinc-800" />

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <Skeleton className="h-16 rounded-2xl bg-zinc-800" />
        <Skeleton className="h-16 rounded-2xl bg-zinc-800" />
        <Skeleton className="h-16 rounded-2xl bg-zinc-800" />
        <Skeleton className="h-16 rounded-2xl bg-zinc-800" />
      </div>

      <div className="mt-6 space-y-2">
        <Skeleton className="h-14 w-full rounded-xl bg-zinc-800" />
        <Skeleton className="h-14 w-full rounded-xl bg-zinc-800" />
        <Skeleton className="h-14 w-full rounded-xl bg-zinc-800" />
      </div>

      <Skeleton className="mt-6 h-32 w-full rounded-2xl bg-zinc-800" />
    </div>
  )
}
