import { boostDefs, type BoostKey } from "@/lib/boost-styles"

export function BoostChip({ type }: { type: BoostKey }) {
  const def = boostDefs[type]
  const Icon = def.icon

  return (
    <span className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[9px] font-bold text-zinc-400">
      <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
      {def.label}
    </span>
  )
}

export function BoostChips({ prediction }: { prediction: any }) {
  const applied: BoostKey[] = []
  if (prediction.insurance_applied) applied.push("insurance")
  if (prediction.gain_boost_applied) applied.push("gain_boost")
  if (prediction.xp_boost_applied) applied.push("xp_boost")
  if (prediction.pr_gamble_applied) applied.push("pr_gamble")

  if (applied.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {applied.map((key) => (
        <BoostChip key={key} type={key} />
      ))}
    </div>
  )
}
