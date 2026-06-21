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
  const [menuOpen, setMenuOpen] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showTitlePicker, setShowTitlePicker] = useState(false)

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
 const ownedTitles = profile.owned_titles
  ? JSON.parse(profile.owned_titles)
  : ["Rookie Predictor"]
  const currentLevelXp = ((profile.level - 1) * profile.level * 100) / 2
  const nextLevelXp = (profile.level * (profile.level + 1) * 100) / 2
  const progressXp = profile.xp - currentLevelXp
  const xpNeeded = nextLevelXp - currentLevelXp
  const progressPercent = (progressXp / xpNeeded) * 100
  const maxStakePercent = Math.min(
  10 + Math.floor((profile.level - 1) / 5) * 2,
  20
)

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

async function updateTitle(title: string) {
  if (!profile) return

  const { error } = await supabase
    .from("profiles")
    .update({
      selected_title: title,
    })
    .eq("id", profile.id)

  if (error) {
    alert(error.message)
    return
  }

  setProfile({
    ...profile,
    selected_title: title,
  })

  setShowTitlePicker(false)
}

async function logout() {
  await supabase.auth.signOut()
  window.location.replace("/login")
}

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#17091f] via-[#0b0b12] to-black p-6 pb-24 text-white">
     <div className="mb-6 flex items-start justify-between">
  <div>
    <h1 className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-red-500 bg-clip-text text-3xl font-extrabold text-transparent">
      PROFILE
    </h1>

    <p className="text-sm text-zinc-500">
      Ton espace personnel
    </p>
  </div>

  <div className="relative">
  <button
    onClick={() => setMenuOpen(!menuOpen)}
    className="rounded-lg border border-zinc-700 bg-zinc-900 p-2"
  >
    ⚙️
  </button>

  {menuOpen && (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setMenuOpen(false)}
      />

      <div className="absolute right-0 top-12 z-50 w-40 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl">
        <button
          onClick={() => {
            setNewUsername(profile.username || "")
            setEditingUsername(true)
            setMenuOpen(false)
          }}
          className="w-full border-b border-zinc-800 px-3 py-2 text-left text-sm text-white"
        >
          Pseudo
        </button>

        <button
          onClick={() => {
            setShowAvatarPicker(true)
            setMenuOpen(false)
          }}
          className="w-full border-b border-zinc-800 px-3 py-2 text-left text-sm text-zinc-400"
        >
          Avatar
        </button>

        <button
  onClick={() => {
    setShowTitlePicker(true)
    setMenuOpen(false)
  }}
  className="w-full border-b border-zinc-800 px-3 py-2 text-left text-sm text-white"
>
  Titre
</button>

        <button
          onClick={logout}
          className="w-full px-3 py-2 text-left text-sm font-bold text-red-400"
        >
          Déconnexion
        </button>
      </div>
    </>
  )}
</div>
</div>

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
  </div>
)}

       <div
  className={`mt-3 inline-flex items-center rounded-full border px-4 py-2 shadow-[0_0_20px_rgba(124,58,237,0.18)] ${
    profile.selected_title === "Rookie Predictor"
      ? "border-green-500/50 bg-green-500/10"
      : profile.selected_title === "Risk Taker"
      ? "border-purple-500/50 bg-purple-500/10"
      : profile.selected_title === "Underdog Hunter"
      ? "border-orange-500/50 bg-orange-500/10"
      : profile.selected_title === "Rocket Analyst"
      ? "border-cyan-500/50 bg-cyan-500/10"
      : profile.selected_title === "Clutch Master"
      ? "border-yellow-500/50 bg-yellow-500/10"
      : profile.selected_title === "GOAT Predictor"
      ? "border-pink-500/60 bg-gradient-to-r from-yellow-500/10 via-pink-500/10 to-purple-500/10"
      : "border-zinc-700 bg-zinc-900"
  }`}
>
  <p
    className={`text-sm font-extrabold uppercase tracking-[0.18em] ${
      profile.selected_title === "Rookie Predictor"
        ? "text-green-400"
        : profile.selected_title === "Risk Taker"
        ? "text-purple-300"
        : profile.selected_title === "Underdog Hunter"
        ? "text-orange-400"
        : profile.selected_title === "Rocket Analyst"
        ? "text-cyan-400"
        : profile.selected_title === "Clutch Master"
        ? "text-yellow-400"
        : profile.selected_title === "GOAT Predictor"
        ? "bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent"
        : "text-white"
    }`}
  >
    {profile.selected_title === "Rookie Predictor"
      ? "⭐ Rookie Predictor"
      : profile.selected_title === "Risk Taker"
      ? "⚡ Risk Taker"
      : profile.selected_title === "Underdog Hunter"
      ? "🎯 Underdog Hunter"
      : profile.selected_title === "Rocket Analyst"
      ? "🚀 Rocket Analyst"
      : profile.selected_title === "Clutch Master"
      ? "🔥 Clutch Master"
      : profile.selected_title === "GOAT Predictor"
      ? "👑 GOAT Predictor"
      : "⭐ Rookie Predictor"}
  </p>
</div>

        <div className="mt-3 flex justify-center gap-2">
  <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300">
    LV {profile.level}
  </span>

  <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
    Mise max {maxStakePercent}%
  </span>
</div>

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
              : "Awaiting result"

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
      {showTitlePicker && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
    <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="mb-4 text-xl font-bold">Choisir un titre</h2>

      <div className="space-y-2">
  {ownedTitles.map((title: string) => (
    <button
      key={title}
      onClick={() => updateTitle(title)}
      className="w-full rounded-xl border border-zinc-800 bg-black/40 p-3 text-left font-bold text-white hover:border-purple-500"
    >
      {title}
    </button>
  ))}
</div>

      <button
        onClick={() => setShowTitlePicker(false)}
        className="mt-4 w-full rounded-xl border border-zinc-700 p-3 font-bold text-zinc-300"
      >
        Fermer
      </button>
    </div>
  </div>
)}
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
