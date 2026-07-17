"use client"

import { useEffect, useState } from "react"
import { Info, Trophy,TrendingUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { BottomNav } from "@/components/bottom-nav"
import { RankBadge } from "@/components/rank-badge"
import { useRouter } from "next/navigation"

type Tab = "league" | "global"

function getRating(player: any) {
  return player.rating ?? Math.min(900 + (player.xp ?? 0), 3800)
}

function getRankFromRating(rating: number) {
  if (rating >= 3500) return { name: "Legend", icon: "♛", color: "text-pink-400", border: "border-pink-500/60", glow: "shadow-[0_0_35px_rgba(244,114,182,0.35)]", next: null, nextRating: null, floor: 3500 }
  if (rating >= 3000) return { name: "Grandmaster", icon: "✦", color: "text-red-400", border: "border-red-500/60", glow: "shadow-[0_0_35px_rgba(248,113,113,0.3)]", next: "Legend", nextRating: 3500, floor: 3000 }
  if (rating >= 2600) return { name: "Master", icon: "◆", color: "text-orange-400", border: "border-orange-500/60", glow: "shadow-[0_0_35px_rgba(251,146,60,0.28)]", next: "Grandmaster", nextRating: 3000, floor: 2600 }
  if (rating >= 2200) return { name: "Diamond", icon: "◇", color: "text-cyan-400", border: "border-cyan-400/60", glow: "shadow-[0_0_35px_rgba(34,211,238,0.28)]", next: "Master", nextRating: 2600, floor: 2200 }
  if (rating >= 1800) return { name: "Platinum", icon: "⬟", color: "text-purple-300", border: "border-purple-400/60", glow: "shadow-[0_0_35px_rgba(168,85,247,0.28)]", next: "Diamond", nextRating: 2200, floor: 1800 }
  if (rating >= 1400) return { name: "Gold", icon: "✦", color: "text-yellow-400", border: "border-yellow-400/60", glow: "shadow-[0_0_35px_rgba(250,204,21,0.28)]", next: "Platinum", nextRating: 1800, floor: 1400 }
  if (rating >= 1000) return { name: "Silver", icon: "◇", color: "text-zinc-200", border: "border-zinc-200/60", glow: "shadow-[0_0_35px_rgba(255,255,255,0.18)]", next: "Gold", nextRating: 1400, floor: 1000 }

  return { name: "Bronze", icon: "⬢", color: "text-orange-700", border: "border-orange-700/60", glow: "shadow-[0_0_35px_rgba(194,65,12,0.25)]", next: "Silver", nextRating: 1000, floor: 0 }
}

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("league")
  const [showInfo, setShowInfo] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchPlayers()
  }, [])

  async function fetchPlayers() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.replace("/login")
      return
    }

    setCurrentUserId(user.id)

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("xp", { ascending: false })

    if (data) setPlayers(data)
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

  return (
  <div className="min-h-screen bg-black px-4 pb-24 pt-6 text-white">
    <h1 className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-red-500 bg-clip-text text-3xl font-extrabold text-transparent">
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

        <p className="mt-3 text-3xl font-black text-white">
          {Math.round(currentRating)} PR
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

          <div className="group relative overflow-hidden rounded-2xl border border-green-400/30 bg-white/5 p-4 shadow-[0_0_20px_rgba(74,222,128,0.12)] transition-all duration-300 hover:border-green-400/70 hover:shadow-[0_0_28px_rgba(74,222,128,0.28)]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-green-400/40 bg-green-500/10 text-green-300 shadow-[0_0_18px_rgba(74,222,128,0.25)]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Tendance
              </p>
              <p className="mt-1 text-xl font-black text-green-400">
                +18 PR
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

    <div className="mt-4 space-y-3">
      {displayedPlayers.map((player, index) => {
        const isMe = player.id === currentUserId
        const playerRating = getRating(player)
        const playerRank = getRankFromRating(playerRating)
        const position = index + 1

        return (
  <div
    key={player.id}
    onClick={ () => {
      console.log(player.id)
      router.push(`/profile/${player.id}`)
    }}
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

    <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-red-600 text-base font-black shadow-[0_0_18px_rgba(236,72,153,0.35)]">
      {player.username?.slice(0, 2).toUpperCase() || "??"}
    </div>

    <div className="min-w-0 flex-1">
      <p className="truncate text-lg font-black leading-tight">
        {player.username || "Player"}
        {isMe && (
          <span className="ml-2 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-black">
            YOU
          </span>
        )}
      </p>

      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
        LV {player.level ?? 1} ·{" "}
        <span className={playerRank.color}>
          {playerRank.icon} {playerRank.name}
        </span>
      </p>
    </div>

    <div className="text-right">
      <p className="text-xl font-black text-purple-300">
        {Math.round(playerRating)}
      </p>
      <p className="text-[10px] font-bold text-zinc-500">PR</p>
    </div>
  </div>
)
      })}
    </div>

    {showInfo && (
      <div
        className="fixed inset-0 z-50 flex items-end bg-black/80"
        onClick={() => setShowInfo(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full rounded-t-3xl border-t border-purple-500 bg-zinc-950 p-6"
        >
          <h2 className="text-xl font-extrabold">
            Comment fonctionnent les rangs ?
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            Ton rang dépend de ton PR. Gagner un pronostic augmente ton PR.
            Perdre un pronostic le diminue. Les outsiders réussis rapportent plus de PR.
          </p>

          <div className="mt-5 space-y-2 text-sm font-bold">
            <p className="text-orange-700">⬢ Bronze · 0 - 999 PR</p>
            <p className="text-zinc-300">◇ Silver · 1000 - 1399 PR</p>
            <p className="text-yellow-400">✦ Gold · 1400 - 1799 PR</p>
            <p className="text-purple-300">⬟ Platinum · 1800 - 2199 PR</p>
            <p className="text-cyan-400">◇ Diamond · 2200 - 2599 PR</p>
            <p className="text-orange-400">◆ Master · 2600 - 2999 PR</p>
            <p className="text-red-400">✦ Grandmaster · 3000 - 3499 PR</p>
            <p className="text-pink-400">♛ Legend · 3500+ PR</p>
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

    <BottomNav />
  </div>
)
 }