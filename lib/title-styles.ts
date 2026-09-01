import { Star, Zap, Target, Rocket, Flame, Crown, Trophy, TrendingUp, Award } from "lucide-react"

export type TitleStyle = {
  icon: typeof Star
  gradient: string
  text: string
  glow: string
}

// Un seul endroit pour l'icône/couleur de chaque titre équipable (boutique
// + succès + saisons), pour ne pas retomber sur un style par défaut faux
// quand un titre n'est pas dans la liste (bug déjà rencontré plusieurs fois).
export const titleStyles: Record<string, TitleStyle> = {
  "Rookie Predictor": {
    icon: Star,
    gradient: "from-green-500/25 to-emerald-600/10",
    text: "text-green-300",
    glow: "rgba(34,197,94,0.4)",
  },
  "Risk Taker": {
    icon: Zap,
    gradient: "from-purple-500/25 to-fuchsia-600/10",
    text: "text-purple-300",
    glow: "rgba(168,85,247,0.4)",
  },
  "Underdog Hunter": {
    icon: Target,
    gradient: "from-orange-500/25 to-red-600/10",
    text: "text-orange-300",
    glow: "rgba(251,146,60,0.4)",
  },
  "Rocket Analyst": {
    icon: Rocket,
    gradient: "from-cyan-500/25 to-blue-600/10",
    text: "text-cyan-300",
    glow: "rgba(34,211,238,0.4)",
  },
  "Clutch Master": {
    icon: Flame,
    gradient: "from-yellow-500/25 to-amber-600/10",
    text: "text-yellow-300",
    glow: "rgba(250,204,21,0.4)",
  },
  "GOAT Predictor": {
    icon: Crown,
    gradient: "from-yellow-400/25 via-pink-500/15 to-purple-500/20",
    text: "bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent",
    glow: "rgba(236,72,153,0.45)",
  },
  "Sur sa Lancée": {
    icon: Flame,
    gradient: "from-orange-500/25 to-red-600/10",
    text: "text-orange-300",
    glow: "rgba(251,146,60,0.4)",
  },
  Flair: {
    icon: Zap,
    gradient: "from-yellow-400/25 to-amber-600/10",
    text: "text-yellow-300",
    glow: "rgba(250,204,21,0.4)",
  },
  Confirmé: {
    icon: Trophy,
    gradient: "from-emerald-400/25 to-teal-600/10",
    text: "text-emerald-300",
    glow: "rgba(52,211,153,0.4)",
  },
  Habitué: {
    icon: TrendingUp,
    gradient: "from-pink-500/25 to-rose-600/10",
    text: "text-pink-300",
    glow: "rgba(236,72,153,0.4)",
  },
}

export const defaultTitleStyle: TitleStyle = {
  icon: Star,
  gradient: "from-zinc-700/40 to-zinc-800/20",
  text: "text-white",
  glow: "rgba(255,255,255,0.08)",
}

const seasonTitleRankStyles: Record<string, { text: string; glow: string; gradient: string }> = {
  Bronze: { text: "text-orange-700", glow: "rgba(194,65,12,0.4)", gradient: "from-orange-700/25 to-orange-900/10" },
  Silver: { text: "text-zinc-200", glow: "rgba(255,255,255,0.35)", gradient: "from-zinc-300/25 to-zinc-600/10" },
  Gold: { text: "text-yellow-400", glow: "rgba(250,204,21,0.4)", gradient: "from-yellow-400/25 to-amber-600/10" },
  Platinum: { text: "text-purple-300", glow: "rgba(168,85,247,0.4)", gradient: "from-purple-400/25 to-fuchsia-600/10" },
  Diamond: { text: "text-cyan-400", glow: "rgba(34,211,238,0.4)", gradient: "from-cyan-400/25 to-blue-600/10" },
  Master: { text: "text-red-400", glow: "rgba(248,113,113,0.4)", gradient: "from-red-400/25 to-rose-700/10" },
  Grandmaster: { text: "text-violet-300", glow: "rgba(168,85,247,0.4)", gradient: "from-purple-400/25 to-fuchsia-600/10" },
  Legend: { text: "text-pink-400", glow: "rgba(244,114,182,0.4)", gradient: "from-pink-400/25 to-fuchsia-700/10" },
}

export function getTitleStyle(title?: string | null): TitleStyle {
  if (!title) return defaultTitleStyle
  if (titleStyles[title]) return titleStyles[title]

  const seasonMatch = title.match(/^(Bronze|Silver|Gold|Platinum|Diamond|Master|Grandmaster|Legend) Saison \d+$/)
  if (seasonMatch) {
    return { icon: Award, ...seasonTitleRankStyles[seasonMatch[1]] }
  }

  return defaultTitleStyle
}
