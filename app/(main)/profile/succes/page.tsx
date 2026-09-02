"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { RewardPopup } from "@/components/reward-popup"
import {
  ArrowLeft,
  Trophy,
  Target,
  ShoppingBag,
  Flame,
  Zap,
  TrendingUp,
  Lock,
  Check,
} from "lucide-react"

const achievementStyles: Record<
  string,
  { icon: typeof Trophy; gradient: string; glow: string }
> = {
  first_prediction: {
    icon: Target,
    gradient: "from-violet-500 to-fuchsia-600",
    glow: "rgba(168,85,247,0.35)",
  },
  first_purchase: {
    icon: ShoppingBag,
    gradient: "from-cyan-400 to-blue-600",
    glow: "rgba(34,211,238,0.35)",
  },
  win_streak_3: {
    icon: Flame,
    gradient: "from-orange-400 to-red-600",
    glow: "rgba(251,146,60,0.35)",
  },
  big_odds_win: {
    icon: Zap,
    gradient: "from-yellow-400 to-amber-600",
    glow: "rgba(250,204,21,0.35)",
  },
  total_wins_10: {
    icon: Trophy,
    gradient: "from-emerald-400 to-teal-600",
    glow: "rgba(52,211,153,0.35)",
  },
  level_10: {
    icon: TrendingUp,
    gradient: "from-pink-500 to-rose-600",
    glow: "rgba(236,72,153,0.35)",
  },
}

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 8 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, bounce: 0.4, duration: 0.5 },
  },
}

export default function SuccesPage() {
  const router = useRouter()
  const [achievements, setAchievements] = useState<any[]>([])
  const [profileAchievements, setProfileAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingKey, setClaimingKey] = useState<string | null>(null)
  const [claimedAchievement, setClaimedAchievement] = useState<{ name: string; rewardText: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace("/login")
      return
    }

    const { data: achievementsData } = await supabase
      .from("achievements")
      .select("*")

    const { data: profileAchievementsData } = await supabase
      .from("profile_achievements")
      .select("*")
      .eq("user_id", user.id)

    setAchievements(achievementsData || [])
    setProfileAchievements(profileAchievementsData || [])
    setLoading(false)
  }

  function getAchievementStatus(key: string) {
    const pa = profileAchievements.find((p) => p.achievement_key === key)
    if (!pa) return "locked"
    if (pa.claimed_at) return "claimed"
    return "unclaimed"
  }

  async function claimAchievement(key: string) {
    setClaimingKey(key)

    const { error } = await supabase.rpc("claim_achievement", {
      p_key: key,
    })

    setClaimingKey(null)

    if (error) {
      alert(error.message)
      return
    }

    setProfileAchievements((prev) =>
      prev.map((pa) =>
        pa.achievement_key === key
          ? { ...pa, claimed_at: new Date().toISOString() }
          : pa
      )
    )

    const achievement = achievements.find((a) => a.key === key)

    if (achievement) {
      const rewardText =
        achievement.reward_type === "points"
          ? `+${achievement.reward_value} points`
          : achievement.reward_type === "xp"
          ? `+${achievement.reward_value} XP`
          : `Titre "${achievement.reward_value}"`

      setClaimedAchievement({ name: achievement.name, rewardText })

      setTimeout(() => {
        setClaimedAchievement(null)
      }, 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Chargement...
      </div>
    )
  }

  const claimedCount = achievements.filter(
    (a) => getAchievementStatus(a.key) === "claimed"
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#17091f] via-[#0b0b12] to-black px-4 pb-24 pt-6 text-white">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-300"
      >
        <ArrowLeft className="h-5 w-5" />
        Retour
      </button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="inline-block bg-clip-text text-3xl font-extrabold text-transparent"
            style={{ backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)" }}
          >
            SUCCÈS
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Débloque des récompenses en progressant
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1.5 text-xs font-bold text-yellow-300">
          {claimedCount}/{achievements.length}
        </div>
      </div>

      <motion.div
        variants={gridVariants}
        initial="hidden"
        animate="show"
        className="mt-8 grid grid-cols-2 gap-3"
      >
        {achievements.map((achievement) => {
          const status = getAchievementStatus(achievement.key)
          const isLocked = status === "locked"
          const isUnclaimed = status === "unclaimed"
          const isClaimed = status === "claimed"
          const style = achievementStyles[achievement.key]
          const Icon = style?.icon ?? Trophy

          return (
            <motion.button
              key={achievement.key}
              variants={itemVariants}
              whileTap={isUnclaimed ? { scale: 0.95 } : undefined}
              onClick={() => isUnclaimed && claimAchievement(achievement.key)}
              disabled={!isUnclaimed || claimingKey === achievement.key}
              className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${
                isUnclaimed
                  ? "border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_20px_rgba(234,179,8,0.15)]"
                  : isClaimed
                  ? "border-zinc-800 bg-zinc-900/40"
                  : "border-zinc-900 bg-black/30"
              }`}
            >
              <div
                className={`relative flex h-14 w-14 items-center justify-center rounded-full ${
                  isLocked ? "bg-zinc-800" : `bg-gradient-to-br ${style.gradient}`
                }`}
                style={!isLocked ? { boxShadow: `0 0 18px ${style.glow}` } : undefined}
              >
                {isLocked ? (
                  <Lock className="h-5 w-5 text-zinc-600" strokeWidth={2.5} />
                ) : (
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                )}

                {isClaimed && (
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-950 bg-green-500">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              <p
                className={`text-[11px] font-semibold leading-tight ${
                  isLocked ? "text-zinc-600" : "text-zinc-200"
                }`}
              >
                {achievement.description}
              </p>

              {isUnclaimed && (
                <span className="rounded-full bg-gradient-to-r from-purple-600 to-red-600 px-3 py-1 text-[10px] font-bold text-white">
                  {claimingKey === achievement.key ? "..." : "Récupérer"}
                </span>
              )}
            </motion.button>
          )
        })}
      </motion.div>

      <RewardPopup
        visible={!!claimedAchievement}
        icon={<Trophy className="h-8 w-8 text-white" strokeWidth={2.5} />}
        title={claimedAchievement?.name ?? ""}
        subtitle={claimedAchievement?.rewardText}
      />
    </div>
  )
}
