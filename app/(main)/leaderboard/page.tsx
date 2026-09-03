"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Info, Trophy,TrendingUp,TrendingDown } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { RankBadge } from "@/components/rank-badge"
import { getRating, getRankFromRating } from "@/lib/rank"
import { LeaderboardSkeleton } from "@/components/leaderboard-skeleton"
import { UserAvatar } from "@/components/user-avatar"
import { AnimatedNumber } from "@/components/animated-number"
import { useRouter } from "next/navigation"
import { useScrollLock } from "@/lib/use-scroll-lock"
import { useProfile } from "@/components/profile-provider"

type Tab = "league" | "global"

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const rowVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, bounce: 0.25, duration: 0.45 },
  },
}

const rankTiers = [
  { name: "Bronze", range: "0 - 999 PR", img: "/ranks/bronze.png", color: "text-orange-700", border: "border-orange-700/50" },
  { name: "Silver", range: "1000 - 1399 PR", img: "/ranks/silver.png", color: "text-zinc-300", border: "border-zinc-300/50" },
  { name: "Gold", range: "1400 - 1799 PR", img: "/ranks/gold.png", color: "text-yellow-400", border: "border-yellow-400/50" },
  { name: "Platinum", range: "1800 - 2199 PR", img: "/ranks/platinum.png", color: "text-purple-300", border: "border-purple-300/50" },
  { name: "Diamond", range: "2200 - 2599 PR", img: "/ranks/diamond.png", color: "text-cyan-400", border: "border-cyan-400/50" },
  { name: "Master", range: "2600 - 2999 PR", img: "/ranks/master.png", color: "text-red-400", border: "border-red-400/50" },
  { name: "Grandmaster", range: "3000 - 3499 PR", img: "/ranks/grandmaster.png", color: "text-violet-300", border: "border-violet-300/50" },
  { name: "Legend", range: "3500+ PR", img: "/ranks/legend.png", color: "text-pink-400", border: "border-pink-400/50" },
]

export default function LeaderboardPage() {
  const { user, loading: profileLoading } = useProfile()
  const currentUserId = user?.id ?? null
  const [players, setPlayers] = useState<any[]>([])
  const [tab, setTab] = useState<Tab>("league")
  const [showInfo, setShowInfo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [todayPrDelta, setTodayPrDelta] = useState(0)
  const router = useRouter()
  const infoPanelRef = useScrollLock(showInfo)


  useEffect(() => {
    if (!profileLoading && !user) {
      router.replace("/login")
      return
    }

    if (user) fetchPlayers(user.id)
  }, [user, profileLoading, router])

  async function fetchPlayers(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("xp", { ascending: false })

    if (data) setPlayers(data)

    const { data: predictionsData } = await supabase
      .from("predictions")
      .select("rating_delta, resolved_at")
      .eq("user_id", userId)
      .not("resolved_at", "is", null)

    if (predictionsData) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const delta = predictionsData
        .filter((prediction) => new Date(prediction.resolved_at) >= todayStart)
        .reduce((sum, prediction) => sum + (prediction.rating_delta ?? 0), 0)

      setTodayPrDelta(delta)
    }

    setLoading(false)
  }

  const currentPlayer = players.find((player) => player.id === currentUserId)
  const currentRating = currentPlayer ? getRating(currentPlayer) : 900
  const currentRank = getRankFromRating(currentRating)

  const leaguePlayers = players
    .filter((player) => getRankFromRating(getRating(player)).name === currentRank.name)
    .sort((a, b) => getRating(b) - getRating(a))

  const globalPlayers = [...players]
    .sort((a, b) => getRating(b) - getRating(a))
    .slice(0, 50)

  const displayedPlayers = tab === "league" ? leaguePlayers : globalPlayers

  const myPosition =
    leaguePlayers.findIndex((player) => player.id === currentUserId) + 1

  const progressPercent =
    currentRank.nextRating
      ? ((currentRating - currentRank.floor) /
          (currentRank.nextRating - currentRank.floor)) *
        100
      : 100

  if (profileLoading || loading) {
    return <LeaderboardSkeleton />
  }

  return (
  <div className="min-h-screen bg-black px-4 pb-24 pt-6 text-white">
    <h1
      className="inline-block bg-clip-text text-3xl font-extrabold text-transparent"
      style={{
        backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)",
      }}
    >
      CLASSEMENT
    </h1>

    <p className="mt-1 text-sm text-zinc-500">
      Grimpe dans ta ligue et vise le Top 50 global
    </p>

    <section
      className={`relative mt-6 overflow-hidden rounded-[36px] border ${currentRank.border} bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 text-center ${currentRank.glow}`}
    >
      <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />

      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
          Ma Ligue
        </p>

        <div className="mt-5 flex justify-center">
          <RankBadge rank={currentRank.name} />
        </div>

        <h2 className={`mt-5 text-5xl font-black tracking-[0.15em] uppercase ${currentRank.color}`}>
          {currentRank.name}
        </h2>

        <p className="mt-3 text-3xl font-black text-white tabular-nums">
          <AnimatedNumber value={currentRating} /> PR
        </p>

        <p className="mt-1 text-sm font-bold text-zinc-500">
          {currentRank.nextRating
            ? `Encore ${Math.max(0, currentRank.nextRating - currentRating)} PR avant ${currentRank.next}`
            : "Tu es au rang maximum"}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="group relative overflow-hidden rounded-2xl border border-purple-400/30 bg-white/5 p-4 shadow-[0_0_20px_rgba(168,85,247,0.12)] transition-all duration-300 hover:border-purple-400/70 hover:shadow-[0_0_28px_rgba(168,85,247,0.28)]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-purple-400/40 bg-purple-500/10 text-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.25)]">
                <Trophy className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Position
              </p>
              <p className="mt-1 text-xl font-black text-white">
                #{myPosition || "-"} / {leaguePlayers.length || 0}
              </p>
            </div>
          </div>

          <div
            className={`group relative overflow-hidden rounded-2xl border bg-white/5 p-4 shadow-[0_0_20px_rgba(74,222,128,0.12)] transition-all duration-300 ${
              todayPrDelta > 0
                ? "border-green-400/30 hover:border-green-400/70 hover:shadow-[0_0_28px_rgba(74,222,128,0.28)]"
                : todayPrDelta < 0
                ? "border-red-400/30 hover:border-red-400/70 hover:shadow-[0_0_28px_rgba(248,113,113,0.28)]"
                : "border-white/10"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl border shadow-[0_0_18px_rgba(74,222,128,0.25)] ${
                  todayPrDelta > 0
                    ? "border-green-400/40 bg-green-500/10 text-green-300"
                    : todayPrDelta < 0
                    ? "border-red-400/40 bg-red-500/10 text-red-300"
                    : "border-white/10 bg-white/5 text-zinc-400"
                }`}
              >
                {todayPrDelta < 0 ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Tendance
              </p>
              <p
                className={`mt-1 text-xl font-black ${
                  todayPrDelta > 0 ? "text-green-400" : todayPrDelta < 0 ? "text-red-400" : "text-zinc-400"
                }`}
              >
                {todayPrDelta > 0 ? "+" : ""}
                {todayPrDelta} PR
              </p>
              <p className="text-[10px] font-bold text-zinc-500">
                aujourd’hui
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs font-bold text-zinc-500">
            <span>{currentRank.name}</span>
            <span>{currentRank.next || "Legend"}</span>
          </div>

          <div className="relative h-3 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-400 to-red-500 shadow-[0_0_18px_rgba(217,70,239,0.6)]"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
            <div className="absolute inset-0 animate-[shine_2.5s_linear_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
        </div>
      </div>
    </section>

    <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
      <button
        onClick={() => setTab("league")}
        className={`py-3 text-sm font-extrabold ${
          tab === "league" ? "bg-purple-600 text-white" : "text-zinc-500"
        }`}
      >
        Ma Ligue
      </button>

      <button
        onClick={() => setTab("global")}
        className={`py-3 text-sm font-extrabold ${
          tab === "global" ? "bg-purple-600 text-white" : "text-zinc-500"
        }`}
      >
        Top 50
      </button>
    </div>

    <div className="mt-6 flex items-center justify-between">
      <h2 className="text-lg font-extrabold">
        {tab === "league" ? `${currentRank.name} Rankings` : "Top 50 Global"}
      </h2>

      <button
        onClick={() => setShowInfo(true)}
        className="flex items-center gap-1 rounded-full border border-purple-400/40 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-300"
      >
        <Info className="h-3.5 w-3.5" />
        Rangs
      </button>
    </div>

    <motion.div variants={gridVariants} initial="hidden" animate="show" className="mt-4 space-y-3">
      {displayedPlayers.map((player, index) => {
        const isMe = player.id === currentUserId
        const playerRating = getRating(player)
        const playerRank = getRankFromRating(playerRating)
        const position = index + 1

        return (
  <motion.div
  key={player.id}
  variants={rowVariants}
  onClick={() => router.push(`/profile/${player.id}`)}
    className={`flex items-center gap-4 rounded-2xl border bg-zinc-950/90 p-4 transition-all duration-300 hover:scale-[1.01] ${
      isMe
        ? "border-purple-400 shadow-[0_0_26px_rgba(168,85,247,0.38)]"
        : position === 1
        ? "border-yellow-400 shadow-[0_0_28px_rgba(250,204,21,0.38)]"
        : position === 2
        ? "border-zinc-200 shadow-[0_0_24px_rgba(255,255,255,0.28)]"
        : position === 3
        ? "border-orange-500 shadow-[0_0_24px_rgba(249,115,22,0.32)]"
        : "border-white/10"
    }`}
  >
    <div className="flex w-10 justify-center text-2xl font-black">
      {position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : position}
    </div>

    <UserAvatar username={player.username} avatarKey={player.avatar_key} size={52} />

    <div className="min-w-0 flex-1">
      <p className="truncate text-lg font-black leading-tight">
        {player.username || "Player"}
        {isMe && (
          <span className="ml-2 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-black">
            YOU
          </span>
        )}
      </p>

      <div className="mt-1 flex items-center gap-1.5">
        <RankBadge rank={playerRank.name} size={20} intensity={0.4} />
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          LV {player.level ?? 1} · <span className={playerRank.color}>{playerRank.name}</span>
        </p>
      </div>
    </div>

    <div className="text-right">
      <p className="text-xl font-black text-purple-300 tabular-nums">
        <AnimatedNumber value={playerRating} />
      </p>
      <p className="text-[10px] font-bold text-zinc-500">PR</p>
    </div>
  </motion.div>
)
      })}
    </motion.div>

    {showInfo && (
      <div
        className="fixed inset-0 z-[60] flex items-end bg-black/80"
        onClick={() => setShowInfo(false)}
      >
        <div
          ref={infoPanelRef}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[85vh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t border-purple-500 bg-zinc-950 p-6"
        >
          <h2 className="text-xl font-extrabold">
            Comment fonctionnent les rangs ?
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            Ton rang dépend de ton PR, qui évolue selon tes résultats — plus tu montes, plus
            c'est exigeant.
          </p>

          <div className="mt-5 space-y-2">
            {rankTiers.map((tier) => {
              const isCurrent = tier.name === currentRank.name

              return (
                <div
                  key={tier.name}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
                    isCurrent ? `${tier.border} bg-white/[0.04]` : "border-white/5"
                  }`}
                >
                  <Image src={tier.img} alt={tier.name} width={32} height={32} className="h-8 w-8 object-contain" />

                  <p className={`flex-1 font-bold ${tier.color}`}>
                    {tier.name}
                    {isCurrent && (
                      <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                        TOI
                      </span>
                    )}
                  </p>

                  <p className="text-xs font-bold text-zinc-500">{tier.range}</p>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => setShowInfo(false)}
            className="mt-6 w-full rounded-xl bg-purple-600 py-3 font-extrabold"
          >
            Compris
          </button>
        </div>
      </div>
    )}

  </div>
)
 }