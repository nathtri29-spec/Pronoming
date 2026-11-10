"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { XpBar } from "@/components/xp-bar"
import { WinRecapModal, type WonRecapItem } from "@/components/win-recap-modal"
import { HomeSkeleton } from "@/components/home-skeleton"
import { useRouter } from "next/navigation"
import { FileText, Gamepad2, Gift } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { AnimatedNumber } from "@/components/animated-number"
import { computeCommunityOdds } from "@/lib/odds"
import { useToast } from "@/components/toast-provider"
import { useProfile } from "@/components/profile-provider"
import { getGameColor } from "@/lib/games"

const CHIP_GAMES: { value: string; label: string }[] = [
  { value: "League of Legends", label: "LoL" },
  { value: "CS2", label: "CS2" },
  { value: "Valorant", label: "Valorant" },
  { value: "Rocket League", label: "Rocket League" },
]

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, bounce: 0.25, duration: 0.5 },
  },
}

export default function Home() {
  const { user, profile, loading: profileLoading } = useProfile()
  const [matches, setMatches] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [seasonNumber, setSeasonNumber] = useState<number | null>(null)
  const router = useRouter()
  const toast = useToast()
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [pendingStakesByMatch, setPendingStakesByMatch] = useState<Record<number, { a: number; b: number }>>({})
  const [winRecap, setWinRecap] = useState<WonRecapItem[] | null>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!profileLoading && !user) {
      router.replace("/login")
      return
    }

    loadMatches()
  }, [profileLoading, user, router])

  useEffect(() => {
    if (user) loadUserData(user.id)
  }, [user])

  async function loadMatches() {
    const { data: matchesData } = await supabase
  .from("matches")
  .select("*")
  .is("winner", null)
  .is("cancelled_at", null)
  .order("start_time", { ascending: true })

    if (matchesData) setMatches(matchesData)

    const communityMatchIds = (matchesData || [])
      .filter((m) => m.odds_mode === "community")
      .map((m) => m.id)

    if (communityMatchIds.length > 0) {
      const { data: pendingPreds } = await supabase
        .from("predictions")
        .select("match_id, selected_team, stake")
        .in("match_id", communityMatchIds)
        .eq("status", "pending")

      const stakes: Record<number, { a: number; b: number }> = {}

      for (const match of matchesData || []) {
        if (match.odds_mode !== "community") continue

        let a = 0
        let b = 0

        for (const p of pendingPreds || []) {
          if (p.match_id !== match.id) continue
          if (p.selected_team === match.team_a) a += p.stake
          else if (p.selected_team === match.team_b) b += p.stake
        }

        stakes[match.id] = { a, b }
      }

      setPendingStakesByMatch(stakes)
    } else {
      setPendingStakesByMatch({})
    }

    const { data: seasonData } = await supabase
      .from("seasons")
      .select("number")
      .eq("status", "active")
      .order("number", { ascending: false })
      .limit(1)
      .single()

    if (seasonData) setSeasonNumber(seasonData.number)

    setLoading(false)
  }

  async function loadUserData(userId: string) {
    const { data: predictionsData } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", userId)

    if (predictionsData) setPredictions(predictionsData)

    await checkUnseenWins(userId)
  }

  async function checkUnseenWins(userId: string) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("wins_seen_at")
      .eq("id", userId)
      .single()

    if (!profileRow) return

    const { data: resolvedPreds } = await supabase
      .from("predictions")
      .select("id, status, stake, odds, rating_delta, gain_boost_applied, insurance_applied, resolved_at, matches (team_a, team_b)")
      .eq("user_id", userId)
      .in("status", ["won", "lost"])
      .gt("resolved_at", profileRow.wins_seen_at)
      .order("resolved_at", { ascending: true })

    if (!resolvedPreds || resolvedPreds.length === 0) return

    setWinRecap(
      resolvedPreds.map((p: any) => {
        const isWon = p.status === "won"
        let gain = 0

        if (isWon) {
          gain = Math.round(p.stake * p.odds)
          if (p.gain_boost_applied) gain = Math.round(gain * 1.2)
        } else {
          gain = p.insurance_applied ? -Math.round(p.stake * 0.5) : -p.stake
        }

        return {
          id: p.id,
          status: p.status as "won" | "lost",
          matchLabel: p.matches ? `${p.matches.team_a} vs ${p.matches.team_b}` : "Pronostic",
          ratingDelta: p.rating_delta,
          gain,
        }
      })
    )
  }

  async function closeWinRecap() {
    setWinRecap(null)
    await supabase.rpc("mark_wins_seen")
  }

  async function copyReferralLink() {
    if (!user) return

    const link = `${window.location.origin}/login?ref=${user.id}`

    try {
      await navigator.clipboard.writeText(link)
      toast.success("Lien d'invitation copié !")
    } catch {
      toast.error("Impossible de copier le lien")
    }
  }

  function xpProgress() {
    if (!profile) return 0

    const currentLevelXp =
      ((profile.season_level - 1) * profile.season_level * 100) / 2

    const nextLevelXp =
      (profile.season_level * (profile.season_level + 1) * 100) / 2

    return ((profile.season_xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
  }

  const displayedMatches = (selectedGame ? matches.filter((m) => m.game === selectedGame) : matches).map(
    (match) => {
      if (match.odds_mode !== "community") return match

      const stakes = pendingStakesByMatch[match.id] ?? { a: 0, b: 0 }
      const { oddsA, oddsB } = computeCommunityOdds(stakes.a, stakes.b)

      return { ...match, odds_team_a: oddsA, odds_team_b: oddsB }
    }
  )

  const gameCounts: Record<string, number> = {}
  for (const { value } of CHIP_GAMES) {
    gameCounts[value] = matches.filter((m) => m.game === value).length
  }

  if (profileLoading || loading) {
  return <HomeSkeleton />
}

  return (
    <div className="min-h-screen bg-black pb-24 text-white">
      <div className="border-b border-zinc-800 px-4 py-4">
  <div className="flex items-center justify-between">
    <h1
      className="inline-block bg-clip-text text-2xl font-extrabold text-transparent"
      style={{
        backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)",
      }}
    >
      PRONOMING
    </h1>

    <div className="flex gap-2">
      <button
        onClick={() => router.push("/predictions")}
        className="flex items-center gap-1.5 rounded-full border border-purple-700 bg-purple-900/20 px-3 py-2 text-sm font-bold text-purple-300"
      >
        <FileText className="h-4 w-4 shrink-0" />

<span className="sm:hidden">Pronos</span>
<span className="hidden sm:inline">Mes Pronos</span>
      </button>

      <div className="flex items-center gap-1.5 rounded-lg border border-blue-400/40 bg-blue-500/15 px-2.5 py-1.5 text-sm font-bold text-blue-200 shadow-[0_0_14px_rgba(59,130,246,0.18)]">
  <Gamepad2 className="h-3.5 w-3.5 text-cyan-300" />
  <span className="tabular-nums">
    <AnimatedNumber value={profile?.points ?? 0} />
  </span>
</div>
    </div>
  </div>

  <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs uppercase tracking-wider text-zinc-500">
            <span className="font-bold text-purple-400">Saison {seasonNumber ?? "-"} · LV {profile?.season_level ?? 1}</span>
            <span className="tabular-nums">
              <AnimatedNumber value={profile?.season_xp ?? 0} /> XP
            </span>
          </div>

          <XpBar progress={xpProgress()} />
        </div>
      </div>

      <main className="px-4 py-5">
        {profile && profile.points < 50 && (
          <button
            onClick={copyReferralLink}
            className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-900/30 to-red-900/20 p-4 text-left"
          >
            <Gift className="h-6 w-6 shrink-0 text-purple-300" strokeWidth={2.2} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white">
                Plus beaucoup de points ? Invite un ami !
              </p>
              <p className="text-xs font-semibold text-zinc-400">
                +200 points dès qu'il s'inscrit avec ton lien
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-purple-600 px-3 py-1.5 text-xs font-bold text-white">
              Copier le lien
            </span>
          </button>
        )}

        <div className="-mx-4 mb-4 mt-1 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            onClick={() => setSelectedGame(null)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
              selectedGame === null
                ? "border-purple-500 bg-purple-600 text-white"
                : "border-white/15 bg-white/5 text-zinc-400"
            }`}
          >
            Tous · {matches.length}
          </button>

          {CHIP_GAMES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSelectedGame(value)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                selectedGame === value
                  ? "border-purple-500 bg-purple-600 text-white"
                  : "border-white/15 bg-white/5 text-zinc-400"
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: getGameColor(value) }} />
              {label} · {gameCounts[value]}
            </button>
          ))}
        </div>

        <motion.div variants={gridVariants} initial="hidden" animate="show" className="space-y-4">

          {displayedMatches.length === 0 && (
  <div className="mt-12 flex flex-col items-center pt-10">
    <div className="relative mb-5">
      <div
        className="rounded-xl px-4 py-2.5"
        style={{
          background: "rgba(124, 58, 237, 0.15)",
          border: "1px solid #c084fc",
        }}
      >
        <p className="text-[13px] font-bold text-white">
          Les prochains matchs arrivent bientôt, reste prêt !
        </p>
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: "100%",
          width: 0,
          height: 0,
          borderLeft: "7px solid transparent",
          borderRight: "7px solid transparent",
          borderTop: "7px solid #c084fc",
        }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: "calc(100% - 1px)",
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "6px solid rgba(124, 58, 237, 0.15)",
        }}
      />
    </div>

    <motion.div
      animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <Image
        src="/mascot/mascot.PNG"
        alt="Mascotte Pronoming"
        width={280}
        height={280}
        className="h-[280px] w-auto object-contain"
      />
    </motion.div>
  </div>
)}

          {displayedMatches.map((match) => {
            const alreadyPredicted = predictions.some(
              (p) => p.match_id === match.id
            )
const date = new Date(match.start_time)

const formattedDate =
  date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  })

const formattedTime =
  date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })

const isLive = date.getTime() <= Date.now()
const startsSoon = !isLive && date.getTime() - Date.now() < 2 * 60 * 60 * 1000

            return (
              <motion.div
                key={match.id}
                variants={cardVariants}
                onClick={() => router.push(`/match/${match.id}`)}
                className="relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#08080d] p-4 shadow-[0_0_25px_rgba(124,58,237,0.08)] transition-all duration-200 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(124,58,237,0.18)]"
              >
                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-purple-600 to-red-600" />

                <div className="mb-4 flex items-start justify-between">
  <div>
    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
      <span style={{ color: getGameColor(match.game) }}>{match.game ?? "Rocket League"}</span>
      {" · "}{match.Tournament || "RLCS"}
    </span>

    {match.odds_mode === "community" && (
      <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-purple-400" />
        </span>
        Cote communautaire
      </div>
    )}
  </div>

  <div className="text-right">
    <p className="text-xs font-semibold uppercase text-zinc-400">
      {formattedDate}
    </p>

    <p className="text-sm font-bold text-white">
      {formattedTime}
    </p>
  </div>
</div>

<p className="-mt-3 mb-4 text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
  ⏱ L'horaire réel peut varier · pronos ouverts jusqu'à l'heure indiquée
</p>

                <div className="mb-5 flex items-center justify-between">
                  <TeamBlock
                    name={match.team_a}
                    odds={match.odds_team_a}
                    color="purple"
                  />

                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-zinc-600">
                      VS
                    </p>

                    {alreadyPredicted ? (
                      <span className="rounded-full border border-purple-500/40 bg-purple-600/20 px-2 py-1 text-[10px] font-bold text-purple-300">
                        PRONOSTIQUÉ
                      </span>
                    ) : startsSoon ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                        </span>
                        Bientôt
                      </span>
                    ) : null}
                  </div>

                  <TeamBlock
                    name={match.team_b}
                    odds={match.odds_team_b}
                    color="red"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/match/${match.id}?team=a`)
                    }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="rounded-xl border border-zinc-500/40 bg-black/40 p-3 text-center transition-colors duration-200 hover:border-purple-500 hover:bg-purple-900/20"
                  >
                    <p className="odds-gradient-text text-xl font-extrabold">
  {Number(match.odds_team_a).toFixed(2)}
</p>
                    <p className="text-xs text-zinc-500">
                      {match.team_a}
                    </p>
                  </motion.button>

                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/match/${match.id}?team=b`)
                    }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="rounded-xl border border-zinc-500/40 bg-black/40 p-3 text-center transition-colors duration-200 hover:border-red-500 hover:bg-red-900/20"
                  >
                    <p className="odds-gradient-text text-xl font-extrabold">
  {Number(match.odds_team_b).toFixed(2)}
</p>
                    <p className="text-xs text-zinc-500">
                      {match.team_b}
                    </p>
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </main>

      <WinRecapModal wins={winRecap} onClose={closeWinRecap} />

</div>
)
}

function TeamBlock({
  name,
  odds,
  color,
}: {
  name: string
  odds: number
  color: "purple" | "red"
}) {
  const initials = name.slice(0, 3).toUpperCase()

  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-xl border text-lg font-extrabold ${
          color === "purple"
            ? "border-purple-500/40 bg-purple-900/20 text-purple-300"
            : "border-red-500/40 bg-red-900/20 text-red-300"
        }`}
      >
        {initials}
      </div>

      <p className="text-center text-sm font-bold">
        {name}
      </p>
    </div>
  )
}