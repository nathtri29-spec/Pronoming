"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Check } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useProfile } from "@/components/profile-provider"
import { useToast } from "@/components/toast-provider"
import { getGameColor } from "@/lib/games"
import { getMaxStake } from "@/lib/economy"
import { getRatingMultiplier } from "@/lib/rank"
import { computeCommunityOdds } from "@/lib/odds"
import { boostDefs, type BoostKey } from "@/lib/boost-styles"
import { MatchSkeleton } from "@/components/match-skeleton"

export default function MatchDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const toast = useToast()
  const { user, profile, loading: profileLoading, refresh } = useProfile()
  const matchId = params.id as string

  const [loading, setLoading] = useState(true)
  const [match, setMatch] = useState<any>(null)
  const [myPrediction, setMyPrediction] = useState<any>(null)
  const [voteCounts, setVoteCounts] = useState<{ a: number; b: number }>({ a: 0, b: 0 })
  const [stakeSums, setStakeSums] = useState<{ a: number; b: number }>({ a: 0, b: 0 })
  const [activeBoosts, setActiveBoosts] = useState<any[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [stake, setStake] = useState(0)
  const [selectedBoosts, setSelectedBoosts] = useState<Set<BoostKey>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!profileLoading && !user) {
      router.replace("/login")
      return
    }

    if (user) fetchMatch(user.id)
  }, [user, profileLoading, matchId])

  async function fetchMatch(userId: string) {
    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single()

    if (!matchData) {
      setLoading(false)
      return
    }

    setMatch(matchData)

    const { data: allPreds } = await supabase
      .from("predictions")
      .select("user_id, selected_team, stake, status")
      .eq("match_id", matchId)
      .eq("status", "pending")

    let a = 0
    let b = 0
    let stakeA = 0
    let stakeB = 0

    for (const p of allPreds || []) {
      if (p.selected_team === matchData.team_a) {
        a += 1
        stakeA += p.stake
      } else if (p.selected_team === matchData.team_b) {
        b += 1
        stakeB += p.stake
      }
    }

    setVoteCounts({ a, b })
    setStakeSums({ a: stakeA, b: stakeB })

    const mine = (allPreds || []).find((p) => p.user_id === userId)
    setMyPrediction(mine ?? null)

    if (!mine) {
      const preselect = searchParams.get("team")
      if (preselect === "a") setSelectedTeam(matchData.team_a)
      else if (preselect === "b") setSelectedTeam(matchData.team_b)
    }

    const { data: boostsData } = await supabase
      .from("profile_boosts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")

    setActiveBoosts(boostsData || [])

    setLoading(false)
  }

  function toggleBoost(key: BoostKey) {
    setSelectedBoosts((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function prLossPreview() {
    const rating = profile?.rating ?? 900
    const base = rating >= 1800 ? 20 : rating >= 1400 ? 5 : 0
    return selectedBoosts.has("pr_gamble") ? base * 2 : base
  }

  function selectTeam(team: string, maxStakeValue: number) {
    setSelectedTeam(team)
    if (!stake) setStake(Math.max(10, Math.floor(maxStakeValue / 2)))
  }

  async function confirmPrediction() {
    if (!user || !profile || !match || !selectedTeam) return

    if (!stake || stake <= 0) {
      toast.error("Entre une mise valide")
      return
    }

    setSubmitting(true)

    const { error } = await supabase.rpc("place_prediction", {
      p_match_id: match.id,
      p_selected_team: selectedTeam,
      p_stake: stake,
      p_use_insurance: selectedBoosts.has("insurance"),
      p_use_gain_boost: selectedBoosts.has("gain_boost"),
      p_use_pr_gamble: selectedBoosts.has("pr_gamble"),
      p_use_xp_boost: selectedBoosts.has("xp_boost"),
    })

    setSubmitting(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success("Pronostic validé !")
    await refresh()
    router.push("/")
  }

  if (profileLoading || loading) {
    return <MatchSkeleton />
  }

  if (!match) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-black px-6 text-center text-white">
        <p className="text-sm text-zinc-500">Ce match n'existe pas ou plus.</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-xl bg-gradient-to-r from-purple-600 to-red-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          Retour à la home
        </button>
      </div>
    )
  }

  const isCommunity = match.odds_mode === "community"
  const { oddsA, oddsB } = isCommunity
    ? computeCommunityOdds(stakeSums.a, stakeSums.b)
    : { oddsA: Number(match.odds_team_a), oddsB: Number(match.odds_team_b) }

  const selectedOdds = selectedTeam === match.team_a ? oddsA : selectedTeam === match.team_b ? oddsB : 0
  const maxStake = profile ? getMaxStake(profile.points, profile.season_level) : 0

  const totalVotes = voteCounts.a + voteCounts.b
  const votePercentA = totalVotes > 0 ? Math.round((voteCounts.a / totalVotes) * 100) : 50
  const votePercentB = 100 - votePercentA

  const isCancelled = !!match.cancelled_at
  const isResolved = !!match.winner
  const hasStarted = match.start_time && new Date(match.start_time).getTime() <= Date.now()

  const date = match.start_time ? new Date(match.start_time) : null
  const formattedDate = date?.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
  const formattedTime = date?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  const bettingClosed = isCancelled || isResolved || hasStarted

  return (
    <div className="min-h-screen bg-black px-4 pb-24 pt-6 text-white">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-300"
      >
        <ArrowLeft className="h-5 w-5" />
        Retour
      </button>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: getGameColor(match.game) }}>
          {match.game ?? "Rocket League"}
        </span>

        <div className="text-right">
          <p className="text-xs font-semibold uppercase text-zinc-400">{formattedDate}</p>
          <p className="text-sm font-bold text-white">{formattedTime}</p>
        </div>
      </div>

      <p className="mt-0.5 text-xs font-semibold text-zinc-500">{match.Tournament || "RLCS"}</p>

      <p className="mt-2 text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
        ⏱ L'horaire réel peut varier · pronos ouverts jusqu'à l'heure indiquée
      </p>

      <div className="mt-6 flex items-center justify-between gap-2">
        <BigTeamBlock name={match.team_a} odds={oddsA} color="purple" />
        <p className="text-3xl font-extrabold text-zinc-600">VS</p>
        <BigTeamBlock name={match.team_b} odds={oddsB} color="red" />
      </div>

      {isCommunity && (
        <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-wider text-purple-300">
          Cote communautaire · basée sur les mises en cours
        </p>
      )}

      {totalVotes > 0 && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950/90 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            Pronos de la communauté ({totalVotes})
          </p>

          <div className="flex h-2.5 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400" style={{ width: `${votePercentA}%` }} />
            <div className="h-full bg-gradient-to-r from-red-400 to-red-600" style={{ width: `${votePercentB}%` }} />
          </div>

          <div className="mt-2 flex justify-between text-xs font-bold">
            <span className="text-purple-300">{match.team_a} · {votePercentA}%</span>
            <span className="text-red-300">{match.team_b} · {votePercentB}%</span>
          </div>
        </div>
      )}

      {isCancelled ? (
        <div className="mt-8 rounded-2xl border border-zinc-600/40 bg-zinc-900/40 p-5 text-center">
          <p className="text-sm font-bold text-zinc-400">Ce match a été annulé</p>
        </div>
      ) : isResolved ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-900/40 p-5 text-center">
          <p className="text-sm font-bold text-zinc-400">
            Match terminé · vainqueur : <span className="text-white">{match.winner}</span>
          </p>
        </div>
      ) : myPrediction ? (
        <div className="mt-8 rounded-2xl border border-purple-500/30 bg-purple-900/10 p-5 text-center">
          <p className="text-sm text-zinc-400">Tu as déjà pronostiqué</p>
          <p className="mt-1 text-xl font-bold text-purple-300">{myPrediction.selected_team}</p>
          <p className="text-sm font-bold text-white">{myPrediction.stake} points · cote {Number(myPrediction.odds).toFixed(2)}</p>
        </div>
      ) : hasStarted ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-900/40 p-5 text-center">
          <p className="text-sm font-bold text-zinc-400">Les paris sont fermés, ce match a déjà commencé</p>
        </div>
      ) : (
        <div className="mt-8">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-500">
            Choisis ton équipe
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => selectTeam(match.team_a, maxStake)}
              className={`rounded-xl border p-3 text-center transition-colors ${
                selectedTeam === match.team_a
                  ? "border-purple-500 bg-purple-900/30"
                  : "border-zinc-500/40 bg-black/40"
              }`}
            >
              <p className="odds-gradient-text text-xl font-extrabold">
                {oddsA.toFixed(2)}
              </p>
              <p className="text-xs text-zinc-400">{match.team_a}</p>
            </button>

            <button
              onClick={() => selectTeam(match.team_b, maxStake)}
              className={`rounded-xl border p-3 text-center transition-colors ${
                selectedTeam === match.team_b
                  ? "border-red-500 bg-red-900/30"
                  : "border-zinc-500/40 bg-black/40"
              }`}
            >
              <p className="odds-gradient-text text-xl font-extrabold">
                {oddsB.toFixed(2)}
              </p>
              <p className="text-xs text-zinc-400">{match.team_b}</p>
            </button>
          </div>

          {selectedTeam && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <label className="mt-6 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                Mise
              </label>

              <input
                type="number"
                placeholder="Entre ta mise"
                value={stake || ""}
                onChange={(e) => setStake(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-white outline-none focus:border-purple-500"
              />

              <p className="mt-2 text-sm font-bold text-white">
                Mise maximale : {maxStake} points
              </p>

              {activeBoosts.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Utiliser un boost sur ce prono ?
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {activeBoosts.map((boost) => {
                      const key = boost.boost_type as BoostKey
                      const def = boostDefs[key]
                      if (!def) return null
                      const Icon = def.icon
                      const selected = selectedBoosts.has(key)

                      return (
                        <button
                          key={boost.id}
                          type="button"
                          onClick={() => toggleBoost(key)}
                          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                            selected
                              ? "border-purple-400 bg-purple-500/20 text-purple-200"
                              : "border-white/15 bg-white/5 text-zinc-400"
                          }`}
                        >
                          <Icon className="h-3 w-3" strokeWidth={2.5} />
                          {def.label}
                          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Gain potentiel</span>
                  <span className="text-xl font-bold text-yellow-400">
                    {Math.round(stake * selectedOdds * (selectedBoosts.has("gain_boost") ? 1.2 : 1))} pts
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-zinc-500">XP estimé</span>
                  <span className="text-purple-400">
                    +{Math.round((stake * selectedOdds) / 10 * (selectedBoosts.has("xp_boost") ? 1.3 : 1))} XP si correct
                  </span>
                </div>

                {selectedBoosts.has("insurance") && (
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-zinc-500">Si perdu</span>
                    <span className="text-emerald-400">
                      +{Math.round(stake * 0.5)} pts remboursés (assurance)
                    </span>
                  </div>
                )}

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-zinc-500">PR estimé</span>
                  <span className="text-red-400">
                    +{Math.round(
                      Math.round(10 * selectedOdds * (maxStake > 0 ? stake / maxStake : 0)) *
                        getRatingMultiplier(profile?.rating ?? 900) *
                        (selectedBoosts.has("pr_gamble") ? 2 : 1)
                    )}{" "}
                    PR si correct
                  </span>
                </div>

                {selectedBoosts.has("pr_gamble") && prLossPreview() > 0 && (
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-zinc-500">PR risqué si perdu</span>
                    <span className="font-bold text-red-500">-{prLossPreview()} PR (doublé)</span>
                  </div>
                )}
              </div>

              <motion.button
                disabled={submitting}
                onClick={confirmPrediction}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-purple-600 to-red-600 p-4 font-extrabold disabled:opacity-60"
              >
                {submitting ? "..." : "CONFIRMER LE PRONOSTIC →"}
              </motion.button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

function BigTeamBlock({ name, odds, color }: { name: string; odds: number; color: "purple" | "red" }) {
  const initials = name.slice(0, 3).toUpperCase()

  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-2xl border text-2xl font-extrabold ${
          color === "purple"
            ? "border-purple-500/40 bg-purple-900/20 text-purple-300"
            : "border-red-500/40 bg-red-900/20 text-red-300"
        }`}
      >
        {initials}
      </div>

      <p className="text-center text-sm font-bold">{name}</p>
      <p className="odds-gradient-text text-center text-lg font-black">{odds.toFixed(2)}</p>
    </div>
  )
}
