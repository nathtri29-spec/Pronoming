"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { BottomNav } from "@/components/bottom-nav"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [stats, setStats] = useState({ wins: 0, losses: 0 })
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState("")


  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    const { data: predictionsData } = await supabase
      .from("predictions")
      .select(`
        *,
        matches (
          team_a,
          team_b
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    const wins = predictionsData?.filter((p) => p.status === "won").length || 0
    const losses = predictionsData?.filter((p) => p.status === "lost").length || 0

    setProfile(profileData)
    setPredictions(predictionsData || [])
    setStats({ wins, losses })
  }

  if (!profile) {
    return <div className="min-h-screen bg-black p-8 text-white">Chargement...</div>
  }

  const total = stats.wins + stats.losses
  const winrate = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : "0"

  const currentLevelXp = ((profile.level - 1) * profile.level * 100) / 2
  const nextLevelXp = (profile.level * (profile.level + 1) * 100) / 2
  const progressXp = profile.xp - currentLevelXp
  const xpNeeded = nextLevelXp - currentLevelXp
  const progressPercent = (progressXp / xpNeeded) * 100

  async function updateUsername() {
  if (!newUsername.trim()) {
    alert("Entre un pseudo valide")
    return
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { error } = await supabase
    .from("profiles")
    .update({ username: newUsername.trim() })
    .eq("id", user.id)

  if (error) {
    alert(error.message)
    return
  }

  setProfile({
    ...profile,
    username: newUsername.trim(),
  })

  setEditingUsername(false)
}

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#17091f] via-[#0b0b12] to-black p-6 pb-24 text-white">
      <h1 className="mb-6 bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-4xl font-bold text-transparent">
        PRONOMING
      </h1>

      <div className="p-6 text-center">
        <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-red-600 text-4xl font-bold shadow-[0_0_25px_rgba(225,29,72,0.35)]">
          {profile.username?.slice(0, 2).toUpperCase()}

          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-yellow-500 text-sm">
            ★
          </div>
        </div>

        {editingUsername ? (
  <div className="mt-3 flex gap-2">
    <input
      value={newUsername}
      onChange={(e) => setNewUsername(e.target.value)}
      placeholder="Nouveau pseudo"
      className="w-full rounded-xl border border-zinc-700 bg-black p-3 text-white outline-none focus:border-purple-500"
    />

    <button
      onClick={updateUsername}
      className="rounded-xl bg-purple-600 px-4 font-bold"
    >
      OK
    </button>
  </div>
) : (
  <div>
    <h2 className="text-3xl font-bold tracking-wide">
      {profile.username}
    </h2>

    <button
      onClick={() => {
        setNewUsername(profile.username || "")
        setEditingUsername(true)
      }}
      className="mt-2 text-xs font-bold uppercase tracking-wider text-purple-300"
    >
      Modifier le pseudo
    </button>
  </div>
)}

        <p className="mt-1 text-sm font-semibold uppercase tracking-[0.25em] text-purple-300">
          ◆ ROOKIE PREDICTOR
        </p>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs uppercase tracking-wider text-zinc-400">
            <span>Season XP</span>
            <span>
              {Math.round(progressXp)} / {Math.round(xpNeeded)} XP
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-300"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatCard label="Points" value={profile.points} />
        <StatCard label="Winrate" value={`${winrate}%`} />
        <StatCard label="Victoires" value={stats.wins} />
        <StatCard label="Défaites" value={stats.losses} />
      </div>

      <div className="mt-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-wide">
            PREDICTION HISTORY
          </h2>
        </div>

        <div>
          {predictions.slice(0, 10).map((prediction) => {
            const isWon = prediction.status === "won"
            const isLost = prediction.status === "lost"

            const resultColor = isWon
              ? "bg-green-500"
              : isLost
              ? "bg-red-500"
              : "bg-purple-500"

            const pointsText = isWon
              ? `+${Math.round(prediction.stake * prediction.odds)} pts`
              : isLost
              ? `-${prediction.stake} pts`
              : "Pending"

            const xpText = isWon
              ? `+${Math.round((prediction.stake * prediction.odds) / 10)} XP`
              : isLost
              ? "+5 XP"
              : "Awaiting"

            return (
              <div
                key={prediction.id}
                className="flex items-center gap-3 py-4 border-b border-white/10 last:border-b-0"
              >
                <div className={`h-2 w-2 rounded-full ${resultColor}`} />

                <div className="flex-1">
                  <p className="text-sm font-bold">
                    {prediction.matches?.team_a} vs {prediction.matches?.team_b}
                  </p>

                  <p className="text-xs text-zinc-500">
                    Pick: {prediction.selected_team}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      isWon
                        ? "text-green-400"
                        : isLost
                        ? "text-red-400"
                        : "text-purple-300"
                    }`}
                  >
                    {pointsText}
                  </p>

                  <p className="text-xs text-purple-300">
                    {xpText}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
        <BottomNav />
    </div>
  )
}

function StatCard({
  label,
  value,
}: {
  label: string
  value: any
}) {
  return (
    <div className="rounded-xl bg-black/30 border border-white/10 p-4 text-center backdrop-blur-sm">
      <p className="text-xs uppercase tracking-wider text-zinc-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  )
}
