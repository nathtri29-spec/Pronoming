import { Zap, Shield, TrendingUp, Dices } from "lucide-react"

export type BoostKey = "xp_boost" | "insurance" | "gain_boost" | "pr_gamble"

export const boostKeys: BoostKey[] = ["xp_boost", "insurance", "gain_boost", "pr_gamble"]

export const boostDefs: Record<
  BoostKey,
  {
    icon: typeof Zap
    label: string
    description: string
    price: number
    maxUses: number
    gradient: string
    glow: string
  }
> = {
  xp_boost: {
    icon: Zap,
    label: "Boost XP",
    description: "+30% d'XP sur tes 3 prochains pronostics résolus",
    price: 750,
    maxUses: 3,
    gradient: "from-blue-500 to-purple-500",
    glow: "rgba(96,165,250,0.35)",
  },
  insurance: {
    icon: Shield,
    label: "Assurance mise",
    description: "Rembourse 50% de la mise si ton prochain prono est perdu",
    price: 1000,
    maxUses: 1,
    gradient: "from-emerald-500 to-teal-500",
    glow: "rgba(52,211,153,0.35)",
  },
  gain_boost: {
    icon: TrendingUp,
    label: "Boost de gains",
    description: "+20% sur le gain de ton prochain prono gagné",
    price: 1250,
    maxUses: 1,
    gradient: "from-amber-500 to-orange-500",
    glow: "rgba(251,191,36,0.35)",
  },
  pr_gamble: {
    icon: Dices,
    label: "Quitte ou Double (PR)",
    description: "Double ton gain de PR en victoire, double ta perte en défaite sur ton prochain prono",
    price: 2500,
    maxUses: 1,
    gradient: "from-red-600 to-zinc-900",
    glow: "rgba(220,38,38,0.4)",
  },
}
