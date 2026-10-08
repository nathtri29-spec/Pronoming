"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Info, BarChart2 } from "lucide-react"
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
  const router = useRouter()
  const infoPanelRef = useScrollLock(showInfo)


  useEffect(() => {
    if (!profileLoading && !user) {
      router.replace("/login")
      return
    }

    if (user) fetchPlayers()
  }, [user, profileLoading, router])

  async function fetchPlayers() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("xp", { ascending: false })

    if (data) setPlayers(data)

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
    <div className="flex items-start justify-between gap-3">
      <div>
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
      </div>

      <button
        onClick={() => router.push("/profile/stats")}
        className="mt-1.5 flex shrink-0 items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-300"
      >
        <BarChart2 className="h-3.5 w-3.5" />
        Stats
      </button>
    </div>

    <section
      className={`relative mt-6 overflow-hidden rounded-2xl border ${currentRank.border} bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-3 ${currentRank.glow}`}
    >
      <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="absolute -right-10 bottom-0 h-24 w-24 rounded-full bg-fuchsia-500/15 blur-3xl" />

      <div className="relative z-10 flex items-center gap-3">
        <RankBadge rank={currentRank.name} size={56} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={`truncate text-lg font-black uppercase tracking-wide ${currentRank.color}`}>
              {currentRank.name}
            </p>
            <p className="shrink-0 text-base font-black text-white tabular-nums">
              <AnimatedNumber value={currentRating} />
              <span className="ml-1 text-xs text-zinc-500">PR</span>
            </p>
          </div>

          <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-400 to-red-500 shadow-[0_0_12px_rgba(217,70,239,0.6)]"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
            <div className="absolute inset-0 animate-[shine_2.5s_linear_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>

          <p className="mt-1 truncate text-[10px] font-bold text-zinc-500">
            {currentRank.nextRating
              ? `Encore ${Math.max(0, currentRank.nextRating - currentRating)} PR avant ${currentRank.next}`
              : "Rang maximum atteint"}
          </p>
        </div>
      </div>
    </section>

    <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
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
                  {tier.name === "Platinum" ? (
                    <RankBadge rank="Platinum" size={32} intensity={0.6} />
                  ) : (
                    <Image src={tier.img} alt={tier.name} width={32} height={32} className="h-8 w-8 object-contain" />
                  )}

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