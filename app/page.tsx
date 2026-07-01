"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { BottomNav } from "@/components/bottom-nav"
import { useRouter } from "next/navigation"
import { FileText, Gem } from "lucide-react"

export default function Home() {
  const [matches, setMatches] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [selectedTeam, setSelectedTeam] = useState("")
  const [selectedOdds, setSelectedOdds] = useState(0)
  const [stake, setStake] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [predictionSuccess, setPredictionSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUser(user)

    if (!user) {
  router.replace("/login")
  return
}

    const { data: matchesData } = await supabase
  .from("matches")
  .select("*")
  .is("winner", null)
  .order("start_time", { ascending: true })

    if (matchesData) setMatches(matchesData)

    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

        if (!profileData) {
  await supabase.from("profiles").insert({
    id: user.id,
    username: user.email?.split("@")[0] || "player",
    points: 1000,
    xp: 0,
    level: 1,
    onboarding_completed: false,
  })

  window.location.replace("/onboarding")
  return
}

      if (profileData) setProfile(profileData)

        if (profileData && profileData.onboarding_completed === false) {
  window.location.replace("/onboarding")
  return
}

      const { data: predictionsData } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", user.id)

      if (predictionsData) setPredictions(predictionsData)
        setLoading(false)
    }
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
      alert("Tu dois être connecté")
      return
    }

    const maxPercent = Math.min(0.1 + Math.floor((profile.level - 1) / 5) * 0.02, 0.2)
    const maxStake = Math.floor(profile.points * maxPercent)

    setSelectedMatch(match)
    setSelectedTeam(team)
    setSelectedOdds(odds)
    setStake(Math.max(10, Math.floor(maxStake / 2)))
  }

  async function confirmPrediction() {
    if (!user || !profile || !selectedMatch) return

    if (!stake || stake <= 0) {
      alert("Entre un stake valide")
      return
    }

    if (stake > profile.points) {
      alert("Pas assez de points")
      return
    }

    const maxPercent = Math.min(0.1 + Math.floor((profile.level - 1) / 5) * 0.02, 0.2)
    const maxStake = Math.floor(profile.points * maxPercent)

    if (stake > maxStake) {
      alert(`Mise maximum autorisée : ${maxStake} points`)
      return
    }

    const existing = predictions.find(
      (p) => p.match_id === selectedMatch.id
    )

    if (existing) {
      alert("Tu as déjà prédit ce match")
      return
    }

    const newPoints = profile.points - stake

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ points: newPoints })
      .eq("id", user.id)

    if (profileError) {
      alert(profileError.message)
      return
    }

    const { error } = await supabase.from("predictions").insert({
      user_id: user.id,
      match_id: selectedMatch.id,
      selected_team: selectedTeam,
      stake,
      odds: selectedOdds,
      status: "pending",
    })

    if (error) {
      alert(error.message)
      return
    }

    setProfile({ ...profile, points: newPoints })
    setSelectedMatch(null)
    setSelectedTeam("")
    setSelectedOdds(0)
    setStake(0)

    setPredictionSuccess(selectedTeam)

setTimeout(() => {
  setPredictionSuccess(null)
}, 2000)
    loadData()
  }

  const maxStake = profile
  ? Math.floor(
      profile.points *
      Math.min(0.1 + Math.floor((profile.level - 1) / 5) * 0.02, 0.2)
    )
  : 0

  if (loading) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      Chargement...
    </div>
  )
}

  return (
    <div className="min-h-screen bg-black pb-24 text-white">
      <div className="border-b border-zinc-800 px-4 py-4">
  <div className="flex items-center justify-between">
    <h1 className="bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-2xl font-extrabold text-transparent">
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
  <Gem className="h-3.5 w-3.5 text-cyan-300" />
  <span>{profile?.points ?? 0}</span>
</div>
    </div>
  </div>

  <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs uppercase tracking-wider text-zinc-500">
            <span>Season 1 · LV {profile?.level ?? 1}</span>
            <span>{profile?.xp ?? 0} XP</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-300"
              style={{ width: `${Math.min(xpProgress(), 100)}%` }}
            />
          </div>
        </div>
      </div>

      <main className="px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            🔥 LIVE & UPCOMING
          </h2>

          <span className="text-xs font-bold text-purple-400">
            ROCKET LEAGUE
          </span>
        </div>

        <div className="space-y-4">

          {matches.length === 0 && (
  <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-950 p-6 text-center">
    <p className="text-lg font-bold text-white">
      Aucun match disponible
    </p>

    <p className="mt-2 text-sm text-zinc-500">
      Les prochains matchs seront bientôt ajoutés.
    </p>
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
            return (
              <div
                key={match.id}
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
                        PREDICTED
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
                  <button
                    onClick={() =>
                      openPrediction(match, match.team_a, match.odds_team_a)
                    }
                    className="rounded-xl border border-white/10 bg-black/40 p-3 text-center transition-all duration-200 hover:border-purple-500 hover:bg-purple-900/20 hover:scale-[0.98]"
                  >
                    <p className="bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-xl font-extrabold text-transparent">
  {match.odds_team_a}
</p>
                    <p className="text-xs text-zinc-500">
                      {match.team_a}
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      openPrediction(match, match.team_b, match.odds_team_b)
                    }
                    className="rounded-xl border border-white/10 bg-black/40 p-3 text-center transition-all duration-200 hover:border-red-500 hover:bg-red-900/20 hover:scale-[0.98]"
                  >
                    <p className="bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-xl font-extrabold text-transparent">
  {match.odds_team_b}
</p>
                    <p className="text-xs text-zinc-500">
                      {match.team_b}
                    </p>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {selectedMatch && (
       <div
  className="fixed inset-0 z-50 flex items-end bg-black/80 animate-backdropFade"
  onClick={() => setSelectedMatch(null)}
>
         <div
className="w-full animate-sheetBounceUp rounded-t-3xl border-t-2 border-purple-600 bg-zinc-950 p-6"
  onClick={(e) => e.stopPropagation()}
>
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-zinc-700" />

            <h2 className="text-2xl font-bold">
              PLACE PREDICTION
            </h2>

            <p className="mb-5 text-sm text-zinc-500">
              {selectedMatch.team_a} vs {selectedMatch.team_b}
            </p>

            <div className="mb-4 rounded-xl border border-purple-500/30 bg-purple-900/10 p-4">
              <p className="text-sm text-zinc-400">Selected pick</p>
              <p className="text-xl font-bold text-purple-300">
                {selectedTeam}
              </p>
              <p className="text-yellow-400">
                Odds {selectedOdds}
              </p>
            </div>

            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Stake
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

            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex justify-between">
                <span className="text-zinc-500">Potential win</span>
                <span className="text-xl font-bold text-yellow-400">
                  {Math.round(stake * selectedOdds)} pts
                </span>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span className="text-zinc-500">Estimated XP</span>
                <span className="text-purple-300">
                  +{Math.round((stake * selectedOdds) / 10)} XP if correct
                </span>
              </div>
            </div>

            <button
              onClick={confirmPrediction}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-purple-600 to-red-600 p-4 font-extrabold"
            >
              CONFIRM PREDICTION →
            </button>

            <button
          onClick={() => setSelectedMatch(null)}
          className="mt-3 w-full rounded-xl border border-zinc-700 p-3"
        >
          CANCEL
        </button>
      </div>
    </div>
  )}

  {predictionSuccess && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="rounded-3xl border border-purple-500 bg-zinc-950 px-8 py-6 text-center shadow-[0_0_40px_rgba(168,85,247,0.6)] animate-pulse">
      <p className="text-4xl">✓</p>

      <p className="mt-3 text-xl font-extrabold text-white">
        Prédiction validée
      </p>

      <p className="mt-1 text-sm font-bold text-purple-300">
        {predictionSuccess}
      </p>
    </div>
  </div>
)}

  <BottomNav />
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