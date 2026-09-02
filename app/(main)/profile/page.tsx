"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { RankBadge } from "@/components/rank-badge"
import { getRating, getRankFromRating } from "@/lib/rank"
import { XpBar } from "@/components/xp-bar"
import {
  Trophy,
  Clock,
  Gamepad2,
  Percent,
  TrendingDown,
  Settings,
  User,
  Sparkles,
  Award,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserAvatar } from "@/components/user-avatar"
import { ProfileSkeleton } from "@/components/profile-skeleton"
import { getTitleStyle } from "@/lib/title-styles"

const seasonRankColors: Record<string, string> = {
  Bronze: "text-orange-700",
  Silver: "text-zinc-200",
  Gold: "text-yellow-400",
  Platinum: "text-purple-300",
  Diamond: "text-cyan-400",
  Master: "text-red-400",
  Grandmaster: "text-violet-300",
  Legend: "text-pink-400",
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [stats, setStats] = useState({ wins: 0, losses: 0 })
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [achievements, setAchievements] = useState<any[]>([])
  const [profileAchievements, setProfileAchievements] = useState<any[]>([])
  const [seasonHistory, setSeasonHistory] = useState<any[]>([])

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

    const { data: achievementsData } = await supabase
      .from("achievements")
      .select("*")

    const { data: profileAchievementsData } = await supabase
      .from("profile_achievements")
      .select("*")
      .eq("user_id", user.id)

    const { data: seasonHistoryData } = await supabase
      .from("season_results")
      .select("*, seasons (number)")
      .eq("user_id", user.id)
      .order("season_id", { ascending: false })

    const wins = predictionsData?.filter((p) => p.status === "won").length || 0
    const losses = predictionsData?.filter((p) => p.status === "lost").length || 0

    setProfile(profileData)
    setPredictions(predictionsData || [])
    setStats({ wins, losses })
    setAchievements(achievementsData || [])
    setProfileAchievements(profileAchievementsData || [])
    setSeasonHistory(seasonHistoryData || [])
  }

  function getAchievementStatus(key: string) {
    const pa = profileAchievements.find((p) => p.achievement_key === key)
    if (!pa) return "locked"
    if (pa.claimed_at) return "claimed"
    return "unclaimed"
  }

  if (!profile) {
    return <ProfileSkeleton />
  }

  const total = stats.wins + stats.losses
  const winrate = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : "0"
  const rank = getRankFromRating(getRating(profile))
  const currentTitleStyle = getTitleStyle(profile.selected_title)
  const TitleIcon = currentTitleStyle.icon
  const currentLevelXp = ((profile.level - 1) * profile.level * 100) / 2
  const nextLevelXp = (profile.level * (profile.level + 1) * 100) / 2
  const progressXp = profile.xp - currentLevelXp
  const xpNeeded = nextLevelXp - currentLevelXp
  const progressPercent = (progressXp / xpNeeded) * 100
  const maxStakePercent = Math.min(
  10 + Math.floor((profile.level - 1) / 5) * 2,
  20
)
  const unclaimedCount = achievements.filter(
    (a) => getAchievementStatus(a.key) === "unclaimed"
  ).length
  const claimedCount = achievements.filter(
    (a) => getAchievementStatus(a.key) === "claimed"
  ).length

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

async function logout() {
  await supabase.auth.signOut()
  window.location.replace("/login")
}

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#17091f] via-[#0b0b12] to-black p-6 pb-24 text-white">
     <div className="mb-6 flex items-start justify-between">
  <div>
    <h1
      className="inline-block bg-clip-text text-3xl font-extrabold text-transparent"
      style={{
        backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)",
      }}
    >
      PROFIL
    </h1>

    <p className="text-sm text-zinc-500">
      Ton espace personnel
    </p>
  </div>

  <div className="flex items-center gap-1.5">
    <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-300">
      Mise max {maxStakePercent}%
    </span>

    <button
      onClick={() => router.push("/profile/succes")}
      className="flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-[11px] font-bold text-yellow-300"
    >
      <Trophy className="h-3 w-3" strokeWidth={2.5} />
      {claimedCount}/{achievements.length}
    </button>

  <div className="relative">
  <button
    onClick={() => setMenuOpen(!menuOpen)}
    className="relative rounded-lg border border-zinc-700 bg-zinc-900 p-2"
  >
    <Settings className="h-4 w-4 text-zinc-300" strokeWidth={2.2} />
    {unclaimedCount > 0 && (
      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
        {unclaimedCount}
      </span>
    )}
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
          className="flex w-full items-center gap-2 border-b border-zinc-800 px-3 py-2 text-left text-sm text-white"
        >
          <User className="h-4 w-4 text-zinc-400" strokeWidth={2} />
          Pseudo
        </button>

        <button
          onClick={() => router.push("/profile/personnalisation")}
          className="flex w-full items-center gap-2 border-b border-zinc-800 px-3 py-2 text-left text-sm text-white"
        >
          <Sparkles className="h-4 w-4 text-zinc-400" strokeWidth={2} />
          Personnalisation
        </button>

        <button
  onClick={() => router.push("/profile/succes")}
  className="relative flex w-full items-center gap-2 border-b border-zinc-800 px-3 py-2 text-left text-sm text-white"
>
  <Trophy className="h-4 w-4 text-zinc-400" strokeWidth={2} />
  Succès
  {unclaimedCount > 0 && (
    <span className="absolute right-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
      {unclaimedCount}
    </span>
  )}
</button>

        <button
          onClick={logout}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold text-red-400"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Déconnexion
        </button>
      </div>
    </>
  )}
</div>
</div>
</div>

      <div className="p-6 text-center">
        <button
          onClick={() => router.push("/profile/personnalisation")}
          className="mx-auto mb-4 block"
        >
          <UserAvatar username={profile.username} avatarKey={profile.avatar_key} size={96} />
        </button>

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
  <div className="flex items-center justify-center gap-2">
    <h2 className="text-3xl font-bold tracking-wide">
      {profile.username}
    </h2>

    <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-300">
      LV {profile.level}
    </span>
  </div>
)}

        <div className="mt-2 flex items-center justify-center gap-2">
          <RankBadge rank={rank.name} size={28} intensity={0.55} />
          <p className={`text-sm font-bold uppercase tracking-wider ${rank.color}`}>
            {rank.name}
          </p>
        </div>

       <div
  className={`relative mt-3 inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-gradient-to-r px-5 py-2.5 ${currentTitleStyle.gradient}`}
  style={{ boxShadow: `0 0 24px ${currentTitleStyle.glow}` }}
>
  <TitleIcon className={`h-4 w-4 shrink-0 ${currentTitleStyle.text.startsWith("bg-") ? "text-pink-300" : currentTitleStyle.text}`} strokeWidth={2.5} />

  <p
    className={`relative text-sm font-extrabold uppercase tracking-[0.18em] ${currentTitleStyle.text}`}
  >
    {profile.selected_title || "Rookie Predictor"}
  </p>

  <div className="pointer-events-none absolute inset-0 animate-[shine_3s_linear_infinite] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
</div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs uppercase tracking-wider text-zinc-400">
            <span>XP Saison</span>
            <span>
              {Math.round(progressXp)} / {Math.round(xpNeeded)} XP
            </span>
          </div>

          <XpBar progress={progressPercent} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatCard
          icon={Gamepad2}
          label="Points"
          value={profile.points}
          color="text-cyan-300"
          bg="bg-cyan-500/10"
          border="border-cyan-500/20"
        />
        <StatCard
          icon={Percent}
          label="Winrate"
          value={`${winrate}%`}
          color="text-purple-300"
          bg="bg-purple-500/10"
          border="border-purple-500/20"
        />
        <StatCard
          icon={Trophy}
          label="Victoires"
          value={stats.wins}
          color="text-green-400"
          bg="bg-green-500/10"
          border="border-green-500/20"
        />
        <StatCard
          icon={TrendingDown}
          label="Défaites"
          value={stats.losses}
          color="text-red-400"
          bg="bg-red-500/10"
          border="border-red-500/20"
        />
      </div>

      {seasonHistory.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-bold tracking-wide">
            SAISONS PASSÉES
          </h2>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {seasonHistory.map((result) => (
              <div
                key={result.id}
                className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              >
                <Award className={seasonRankColors[result.final_rank] ?? "text-zinc-300"} size={20} />
                <p className="text-xs font-bold text-zinc-500">
                  Saison {result.seasons?.number}
                </p>
                <p className={`text-sm font-bold ${seasonRankColors[result.final_rank] ?? "text-zinc-300"}`}>
                  {result.final_rank}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-wide">
            HISTORIQUE DES PRONOS
          </h2>

          <Link
            href="/predictions"
            className="text-xs font-bold text-purple-300"
          >
            Voir tout
          </Link>
        </div>

        {predictions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-center">
            <p className="text-sm text-zinc-500">Aucun prono pour l'instant</p>
          </div>
        ) : (
          <div className="space-y-2">
            {predictions.slice(0, 5).map((prediction) => {
              const isWon = prediction.status === "won"
              const isLost = prediction.status === "lost"

              const Icon = isWon ? Trophy : isLost ? TrendingDown : Clock
              const color = isWon
                ? "text-green-400"
                : isLost
                ? "text-red-400"
                : "text-purple-300"
              const bg = isWon
                ? "bg-green-500/10"
                : isLost
                ? "bg-red-500/10"
                : "bg-purple-500/10"
              const border = isWon
                ? "border-green-500/30"
                : isLost
                ? "border-red-500/30"
                : "border-purple-500/30"

              const pointsText = isWon
                ? `+${Math.round(prediction.stake * prediction.odds)} pts`
                : isLost
                ? `-${prediction.stake} pts`
                : "En attente"

              const xpText = isWon
                ? `+${Math.round((prediction.stake * prediction.odds) / 10)} XP`
                : isLost
                ? "+5 XP"
                : null

              return (
                <div
                  key={prediction.id}
                  className={`flex items-center gap-3 rounded-xl border ${border} bg-black/20 p-3`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg} ${color}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.5} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">
                      {prediction.matches?.team_a} vs {prediction.matches?.team_b}
                    </p>

                    <p className="text-xs text-zinc-500">
                      Pick: {prediction.selected_team}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-bold ${color}`}>{pointsText}</p>

                    {xpText && (
                      <p className="text-xs text-purple-300">{xpText}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  border,
}: {
  icon: typeof Gamepad2
  label: string
  value: any
  color: string
  bg: string
  border: string
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border ${border} bg-black/30 p-4 backdrop-blur-sm`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg} ${color}`}>
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </div>

      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-zinc-400">
          {label}
        </p>

        <p className="text-xl font-bold text-white">
          {value}
        </p>
      </div>
    </div>
  )
}
