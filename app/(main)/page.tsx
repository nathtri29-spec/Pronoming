"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { XpBar } from "@/components/xp-bar"
import { RewardPopup } from "@/components/reward-popup"
import { HomeSkeleton } from "@/components/home-skeleton"
import { useRouter } from "next/navigation"
import { FileText, Gamepad2, Check, Flame } from "lucide-react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { getRatingMultiplier } from "@/lib/rank"
import { useScrollLock } from "@/lib/use-scroll-lock"
import { boostDefs, type BoostKey } from "@/lib/boost-styles"
import { AnimatedNumber } from "@/components/animated-number"
import { getMaxStake } from "@/lib/economy"
import { useToast } from "@/components/toast-provider"
import { useProfile } from "@/components/profile-provider"

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

const sheetVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring" as const, bounce: 0.25, duration: 0.45 } },
  exit: { y: "100%", opacity: 0, transition: { duration: 0.28, ease: "easeIn" as const } },
}

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
  const { user, profile, loading: profileLoading, refresh } = useProfile()
  const [matches, setMatches] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [selectedTeam, setSelectedTeam] = useState("")
  const [selectedOdds, setSelectedOdds] = useState(0)
  const [stake, setStake] = useState(0)
  const [loading, setLoading] = useState(true)
  const [seasonNumber, setSeasonNumber] = useState<number | null>(null)
  const router = useRouter()
  const toast = useToast()
  const [predictionSuccess, setPredictionSuccess] = useState<string | null>(null)
  const [activeBoosts, setActiveBoosts] = useState<any[]>([])
  const [selectedBoosts, setSelectedBoosts] = useState<Set<BoostKey>>(new Set())
  const sheetPanelRef = useScrollLock(!!selectedMatch)
  const reduceMotion = useReducedMotion()

  function toggleBoost(type: BoostKey) {
    setSelectedBoosts((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  function prLossPreview() {
    const rating = profile?.rating ?? 900
    const base = rating >= 1800 ? 20 : rating >= 1400 ? 5 : 0
    return selectedBoosts.has("pr_gamble") ? base * 2 : base
  }

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
  .order("start_time", { ascending: true })

    if (matchesData) setMatches(matchesData)

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

    const { data: boostsData } = await supabase
      .from("profile_boosts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")

    setActiveBoosts(boostsData || [])
  }

  function xpProgress() {
    if (!profile) return 0

    const currentLevelXp =
      ((profile.level - 1) * profile.level * 100) / 2

    const nextLevelXp =
      (profile.level * (profile.level + 1) * 100) / 2

    return ((profile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
  }

  function openPrediction(match: any, team: string, odds: number) {
    if (!profile) {
      toast.error("Tu dois être connecté")
      return
    }

    const maxStake = getMaxStake(profile.points, profile.level)

    setSelectedMatch(match)
    setSelectedTeam(team)
    setSelectedOdds(odds)
    setStake(Math.max(10, Math.floor(maxStake / 2)))
    setSelectedBoosts(new Set())
  }

  async function confirmPrediction() {
    if (!user || !profile || !selectedMatch) return

    if (!stake || stake <= 0) {
      toast.error("Entre un stake valide")
      return
    }

    // Ces vérifications restent ici pour un retour instantané à l'utilisateur,
    // mais c'est la fonction place_prediction (côté serveur) qui fait foi :
    // impossible de les contourner depuis le navigateur.
    if (stake > profile.points) {
      toast.error("Pas assez de points")
      return
    }

    const maxStake = getMaxStake(profile.points, profile.level)

    if (stake > maxStake) {
      toast.error(`Mise maximum autorisée : ${maxStake} points`)
      return
    }

    const existing = predictions.find(
      (p) => p.match_id === selectedMatch.id
    )

    if (existing) {
      toast.error("Tu as déjà prédit ce match")
      return
    }

    const { error } = await supabase.rpc("place_prediction", {
      p_match_id: selectedMatch.id,
      p_selected_team: selectedTeam,
      p_stake: stake,
      p_use_insurance: selectedBoosts.has("insurance"),
      p_use_gain_boost: selectedBoosts.has("gain_boost"),
      p_use_pr_gamble: selectedBoosts.has("pr_gamble"),
      p_use_xp_boost: selectedBoosts.has("xp_boost"),
    })

    if (error) {
      toast.error(error.message)
      return
    }

    setSelectedMatch(null)
    setSelectedTeam("")
    setSelectedOdds(0)
    setStake(0)
    setSelectedBoosts(new Set())

    setPredictionSuccess(selectedTeam)

setTimeout(() => {
  setPredictionSuccess(null)
}, 2000)
    await refresh()
    if (user) loadUserData(user.id)
  }

  const maxStake = profile ? getMaxStake(profile.points, profile.level) : 0

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
            <span className="font-bold text-purple-400">Saison {seasonNumber ?? "-"} · LV {profile?.level ?? 1}</span>
            <span className="tabular-nums">
              <AnimatedNumber value={profile?.xp ?? 0} /> XP
            </span>
          </div>

          <XpBar progress={xpProgress()} />
        </div>
      </div>

      <main className="px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Flame className="h-5 w-5 text-orange-400" strokeWidth={2.5} />
            EN DIRECT & À VENIR
          </h2>

          <span className="text-xs font-bold text-purple-400">
            ROCKET LEAGUE
          </span>
        </div>

        <motion.div variants={gridVariants} initial="hidden" animate="show" className="space-y-4">

          {matches.length === 0 && (
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

          {matches.map((match) => {
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
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#08080d] p-4 shadow-[0_0_25px_rgba(124,58,237,0.08)] transition-all duration-200 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(124,58,237,0.18)]"
              >
                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-purple-600 to-red-600" />

                <div className="mb-4 flex items-start justify-between">
  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
    {match.Tournament || "RLCS"}
  </span>

  <div className="text-right">
    <p className="text-xs font-semibold uppercase text-zinc-400">
      {formattedDate}
    </p>

    <p className="text-sm font-bold text-white">
      {formattedTime}
    </p>
  </div>
</div>

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
                    ) : isLive ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                        </span>
                        En direct
                      </span>
                    ) : startsSoon ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                        </span>
                        Bientôt
                      </span>
                    ) : (
                      <p className="text-xs text-zinc-600">BO5</p>
                    )}
                  </div>

                  <TeamBlock
                    name={match.team_b}
                    odds={match.odds_team_b}
                    color="red"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    onClick={() =>
                      !alreadyPredicted &&
                      openPrediction(match, match.team_a, match.odds_team_a)
                    }
                    disabled={alreadyPredicted}
                    whileTap={alreadyPredicted ? undefined : { scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="rounded-xl border border-zinc-500/40 bg-black/40 p-3 text-center transition-colors duration-200 hover:border-purple-500 hover:bg-purple-900/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-500/40 disabled:hover:bg-black/40"
                  >
                    <p className="bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-xl font-extrabold text-transparent">
  {Number(match.odds_team_a).toFixed(2)}
</p>
                    <p className="text-xs text-zinc-500">
                      {match.team_a}
                    </p>
                  </motion.button>

                  <motion.button
                    onClick={() =>
                      !alreadyPredicted &&
                      openPrediction(match, match.team_b, match.odds_team_b)
                    }
                    disabled={alreadyPredicted}
                    whileTap={alreadyPredicted ? undefined : { scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="rounded-xl border border-zinc-500/40 bg-black/40 p-3 text-center transition-colors duration-200 hover:border-red-500 hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-500/40 disabled:hover:bg-black/40"
                  >
                    <p className="bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-xl font-extrabold text-transparent">
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

      <AnimatePresence>
      {selectedMatch && (
       <motion.div
  className="fixed inset-0 z-[60] flex items-end bg-black/80"
  variants={backdropVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
  onClick={() => setSelectedMatch(null)}
>
         <motion.div
ref={sheetPanelRef}
className="max-h-[85vh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t-2 border-purple-600 bg-zinc-950 p-6"
  variants={sheetVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
  onClick={(e) => e.stopPropagation()}
>
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-zinc-700" />

            <h2 className="text-2xl font-bold">
              PLACER UN PRONOSTIC
            </h2>

            <p className="mb-5 text-sm text-zinc-500">
              {selectedMatch.team_a} vs {selectedMatch.team_b}
            </p>

            <div className="mb-4 rounded-xl border border-purple-500/30 bg-purple-900/10 p-4">
              <p className="text-sm text-zinc-400">Sélection</p>
              <p className="text-xl font-bold text-purple-300">
                {selectedTeam}
              </p>
              <p className="text-yellow-400">
                Cote {Number(selectedOdds).toFixed(2)}
              </p>
            </div>

            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Mise
            </label>

            <input
  type="number"
  placeholder="Entrez votre mise"
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
                  <span className="font-bold text-red-500">
                    -{prLossPreview()} PR (doublé)
                  </span>
                </div>
              )}
            </div>

            <motion.button
              onClick={confirmPrediction}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-purple-600 to-red-600 p-4 font-extrabold"
            >
              CONFIRMER LE PRONOSTIC →
            </motion.button>

            <motion.button
          onClick={() => setSelectedMatch(null)}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="mt-3 w-full rounded-xl border border-zinc-700 p-3"
        >
          ANNULER
        </motion.button>
      </motion.div>
    </motion.div>
  )}
      </AnimatePresence>

  <RewardPopup
    visible={!!predictionSuccess}
    icon={<Check className="h-8 w-8 text-white" strokeWidth={3} />}
    title="Prédiction validée"
    subtitle={predictionSuccess ?? undefined}
  />

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