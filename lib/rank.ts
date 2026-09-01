export type RankInfo = {
  name: string
  icon: string
  color: string
  border: string
  glow: string
  aura: string
  next: string | null
  nextRating: number | null
  floor: number
}

export function getRating(profile: { rating?: number }) {
  return profile.rating ?? 900
}

/** Doit rester identique au CASE de resolve_match dans supabase/security.sql. */
export function getRatingMultiplier(rating: number) {
  if (rating >= 3500) return 0.3
  if (rating >= 3000) return 0.4
  if (rating >= 2600) return 0.55
  if (rating >= 2200) return 0.7
  if (rating >= 1800) return 0.85
  return 1.0
}

export function getRankFromRating(rating: number): RankInfo {
  if (rating >= 3500)
    return {
      name: "Legend",
      icon: "♛",
      color: "text-pink-400",
      border: "border-pink-500/60",
      glow: "shadow-[0_0_35px_rgba(244,114,182,0.35)]",
      aura: "rgba(244,114,182,0.4)",
      next: null,
      nextRating: null,
      floor: 3500,
    }
  if (rating >= 3000)
    return {
      name: "Grandmaster",
      icon: "✦",
      color: "text-violet-300",
      border: "border-purple-500/60",
      glow: "shadow-[0_0_35px_rgba(168,85,247,0.3)]",
      aura: "rgba(168,85,247,0.4)",
      next: "Legend",
      nextRating: 3500,
      floor: 3000,
    }
  if (rating >= 2600)
    return {
      name: "Master",
      icon: "◆",
      color: "text-red-400",
      border: "border-red-500/60",
      glow: "shadow-[0_0_35px_rgba(248,113,113,0.3)]",
      aura: "rgba(248,113,113,0.4)",
      next: "Grandmaster",
      nextRating: 3000,
      floor: 2600,
    }
  if (rating >= 2200)
    return {
      name: "Diamond",
      icon: "◇",
      color: "text-cyan-400",
      border: "border-cyan-400/60",
      glow: "shadow-[0_0_35px_rgba(34,211,238,0.28)]",
      aura: "rgba(34,211,238,0.4)",
      next: "Master",
      nextRating: 2600,
      floor: 2200,
    }
  if (rating >= 1800)
    return {
      name: "Platinum",
      icon: "⬟",
      color: "text-purple-300",
      border: "border-purple-400/60",
      glow: "shadow-[0_0_35px_rgba(168,85,247,0.28)]",
      aura: "rgba(168,85,247,0.4)",
      next: "Diamond",
      nextRating: 2200,
      floor: 1800,
    }
  if (rating >= 1400)
    return {
      name: "Gold",
      icon: "✦",
      color: "text-yellow-400",
      border: "border-yellow-400/60",
      glow: "shadow-[0_0_35px_rgba(250,204,21,0.28)]",
      aura: "rgba(250,204,21,0.4)",
      next: "Platinum",
      nextRating: 1800,
      floor: 1400,
    }
  if (rating >= 1000)
    return {
      name: "Silver",
      icon: "◇",
      color: "text-zinc-200",
      border: "border-zinc-200/60",
      glow: "shadow-[0_0_35px_rgba(255,255,255,0.18)]",
      aura: "rgba(255,255,255,0.35)",
      next: "Gold",
      nextRating: 1400,
      floor: 1000,
    }

  return {
    name: "Bronze",
    icon: "⬢",
    color: "text-orange-700",
    border: "border-orange-700/60",
    glow: "shadow-[0_0_35px_rgba(194,65,12,0.25)]",
    aura: "rgba(194,65,12,0.4)",
    next: "Silver",
    nextRating: 1000,
    floor: 0,
  }
}
