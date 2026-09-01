"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { RankBadge } from "@/components/rank-badge"
import { getRating, getRankFromRating } from "@/lib/rank"
import { XpBar } from "@/components/xp-bar"
import { RewardPopup } from "@/components/reward-popup"
import {
  Trophy,
  Target,
  ShoppingBag,
  Flame,
  Zap,
  TrendingUp,
  Lock,
  Check,
  Clock,
  Star,
  Rocket,
  Crown,
  Gamepad2,
  Percent,
  TrendingDown,
  Settings,
  User,
  Image as ImageIcon,
  Award,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { UserAvatar } from "@/components/user-avatar"
import { avatarEmblems, avatarKeys } from "@/lib/avatars"
import { ProfileSkeleton } from "@/components/profile-skeleton"

const achievementStyles: Record<
  string,
  { icon: typeof Trophy; gradient: string; glow: string }
> = {
  first_prediction: {
    icon: Target,
    gradient: "from-violet-500 to-fuchsia-600",
    glow: "rgba(168,85,247,0.35)",
  },
  first_purchase: {
    icon: ShoppingBag,
    gradient: "from-cyan-400 to-blue-600",
    glow: "rgba(34,211,238,0.35)",
  },
  win_streak_3: {
    icon: Flame,
    gradient: "from-orange-400 to-red-600",
    glow: "rgba(251,146,60,0.35)",
  },
  big_odds_win: {
    icon: Zap,
    gradient: "from-yellow-400 to-amber-600",
    glow: "rgba(250,204,21,0.35)",
  },
  total_wins_10: {
    icon: Trophy,
    gradient: "from-emerald-400 to-teal-600",
    glow: "rgba(52,211,153,0.35)",
  },
  level_10: {
    icon: TrendingUp,
    gradient: "from-pink-500 to-rose-600",
    glow: "rgba(236,72,153,0.35)",
  },
}

// Un seul endroit pour l'icône/couleur de chaque titre équipable (boutique
// + succès), pour ne pas retomber sur "Rookie Predictor" par défaut quand
// un titre n'est pas dans la liste (bug corrigé : les titres de succès
// n'y étaient pas).
const titleStyles: Record<
  string,
  { icon: typeof Star; gradient: string; text: string; glow: string }
> = {
  "Rookie Predictor": {
    icon: Star,
    gradient: "from-green-500/25 to-emerald-600/10",
    text: "text-green-300",
    glow: "rgba(34,197,94,0.4)",
  },
  "Risk Taker": {
    icon: Zap,
    gradient: "from-purple-500/25 to-fuchsia-600/10",
    text: "text-purple-300",
    glow: "rgba(168,85,247,0.4)",
  },
  "Underdog Hunter": {
    icon: Target,
    gradient: "from-orange-500/25 to-red-600/10",
    text: "text-orange-300",
    glow: "rgba(251,146,60,0.4)",
  },
  "Rocket Analyst": {
    icon: Rocket,
    gradient: "from-cyan-500/25 to-blue-600/10",
    text: "text-cyan-300",
    glow: "rgba(34,211,238,0.4)",
  },
  "Clutch Master": {
    icon: Flame,
    gradient: "from-yellow-500/25 to-amber-600/10",
    text: "text-yellow-300",
    glow: "rgba(250,204,21,0.4)",
  },
  "GOAT Predictor": {
    icon: Crown,
    gradient: "from-yellow-400/25 via-pink-500/15 to-purple-500/20",
    text: "bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent",
    glow: "rgba(236,72,153,0.45)",
  },
  "Sur sa Lancée": {
    icon: Flame,
    gradient: "from-orange-500/25 to-red-600/10",
    text: "text-orange-300",
    glow: "rgba(251,146,60,0.4)",
  },
  Flair: {
    icon: Zap,
    gradient: "from-yellow-400/25 to-amber-600/10",
    text: "text-yellow-300",
    glow: "rgba(250,204,21,0.4)",
  },
  Confirmé: {
    icon: Trophy,
    gradient: "from-emerald-400/25 to-teal-600/10",
    text: "text-emerald-300",
    glow: "rgba(52,211,153,0.4)",
  },
  Habitué: {
    icon: TrendingUp,
    gradient: "from-pink-500/25 to-rose-600/10",
    text: "text-pink-300",
    glow: "rgba(236,72,153,0.4)",
  },
}

const defaultTitleStyle = {
  icon: Star,
  gradient: "from-zinc-700/40 to-zinc-800/20",
  text: "text-white",
  glow: "rgba(255,255,255,0.08)",
}

const seasonTitleRankStyles: Record<string, { text: string; glow: string; gradient: string }> = {
  Bronze: { text: "text-orange-700", glow: "rgba(194,65,12,0.4)", gradient: "from-orange-700/25 to-orange-900/10" },
  Silver: { text: "text-zinc-200", glow: "rgba(255,255,255,0.35)", gradient: "from-zinc-300/25 to-zinc-600/10" },
  Gold: { text: "text-yellow-400", glow: "rgba(250,204,21,0.4)", gradient: "from-yellow-400/25 to-amber-600/10" },
  Platinum: { text: "text-purple-300", glow: "rgba(168,85,247,0.4)", gradient: "from-purple-400/25 to-fuchsia-600/10" },
  Diamond: { text: "text-cyan-400", glow: "rgba(34,211,238,0.4)", gradient: "from-cyan-400/25 to-blue-600/10" },
  Master: { text: "text-red-400", glow: "rgba(248,113,113,0.4)", gradient: "from-red-400/25 to-rose-700/10" },
  Grandmaster: { text: "text-violet-300", glow: "rgba(168,85,247,0.4)", gradient: "from-purple-400/25 to-fuchsia-600/10" },
  Legend: { text: "text-pink-400", glow: "rgba(244,114,182,0.4)", gradient: "from-pink-400/25 to-fuchsia-700/10" },
}

function getTitleStyle(title?: string | null) {
  if (!title) return defaultTitleStyle
  if (titleStyles[title]) return titleStyles[title]

  const seasonMatch = title.match(/^(Bronze|Silver|Gold|Platinum|Diamond|Master|Grandmaster|Legend) Saison \d+$/)
  if (seasonMatch) {
    return { icon: Award, ...seasonTitleRankStyles[seasonMatch[1]] }
  }

  return defaultTitleStyle
}

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
  const [profile, setProfile] = useState<any>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [stats, setStats] = useState({ wins: 0, losses: 0 })
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showTitlePicker, setShowTitlePicker] = useState(false)
  const [achievements, setAchievements] = useState<any[]>([])
  const [profileAchievements, setProfileAchievements] = useState<any[]>([])
  const [showAchievements, setShowAchievements] = useState(false)
  const [claimingKey, setClaimingKey] = useState<string | null>(null)
  const [claimedAchievement, setClaimedAchievement] = useState<{ name: string; rewardText: string } | null>(null)
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

  async function claimAchievement(key: string) {
    setClaimingKey(key)

    const { data, error } = await supabase.rpc("claim_achievement", {
      p_key: key,
    })

    setClaimingKey(null)

    if (error) {
      alert(error.message)
      return
    }

    setProfile(data)
    setProfileAchievements((prev) =>
      prev.map((pa) =>
        pa.achievement_key === key
          ? { ...pa, claimed_at: new Date().toISOString() }
          : pa
      )
    )

    const achievement = achievements.find((a) => a.key === key)

    if (achievement) {
      const rewardText =
        achievement.reward_type === "points"
          ? `+${achievement.reward_value} points`
          : achievement.reward_type === "xp"
          ? `+${achievement.reward_value} XP`
          : `Titre "${achievement.reward_value}"`

      setClaimedAchievement({ name: achievement.name, rewardText })

      setTimeout(() => {
        setClaimedAchievement(null)
      }, 3000)
    }
  }

  if (!profile) {
    return <ProfileSkeleton />
  }

  const total = stats.wins + stats.losses
  const winrate = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : "0"
  const rank = getRankFromRating(getRating(profile))
  const currentTitleStyle = getTitleStyle(profile.selected_title)
  const TitleIcon = currentTitleStyle.icon
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

async function updateAvatar(key: string) {
  if (!profile) return

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_key: key })
    .eq("id", profile.id)

  if (error) {
    alert(error.message)
    return
  }

  setProfile({
    ...profile,
    avatar_key: key,
  })

  setShowAvatarPicker(false)
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
          onClick={() => {
            setShowAvatarPicker(true)
            setMenuOpen(false)
          }}
          className="flex w-full items-center gap-2 border-b border-zinc-800 px-3 py-2 text-left text-sm text-white"
        >
          <ImageIcon className="h-4 w-4 text-zinc-400" strokeWidth={2} />
          Avatar
        </button>

        <button
  onClick={() => {
    setShowTitlePicker(true)
    setMenuOpen(false)
  }}
  className="flex w-full items-center gap-2 border-b border-zinc-800 px-3 py-2 text-left text-sm text-white"
>
  <Award className="h-4 w-4 text-zinc-400" strokeWidth={2} />
  Titre
</button>

        <button
  onClick={() => {
    setShowAchievements(true)
    setMenuOpen(false)
  }}
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

      <div className="p-6 text-center">
        <button
          onClick={() => setShowAvatarPicker(true)}
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
  <div>
    <h2 className="text-3xl font-bold tracking-wide">
      {profile.username}
    </h2>
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

        <div className="mt-3 flex justify-center gap-2">
  <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300">
    LV {profile.level}
  </span>

  <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
    Mise max {maxStakePercent}%
  </span>

  <button
    onClick={() => setShowAchievements(true)}
    className="flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300"
  >
    <Trophy className="h-3 w-3" strokeWidth={2.5} />
    {claimedCount}/{achievements.length}
  </button>
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
      {showTitlePicker && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
    <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="mb-4 text-xl font-bold">Choisir un titre</h2>

      <div className="space-y-2">
  {ownedTitles.map((title: string) => {
    const style = getTitleStyle(title)
    const Icon = style.icon
    const isEquipped = profile.selected_title === title
    const textClass = style.text.startsWith("bg-") ? "text-pink-300" : style.text

    return (
      <button
        key={title}
        onClick={() => updateTitle(title)}
        className={`flex w-full items-center gap-2 rounded-xl border bg-gradient-to-r p-3 text-left font-bold ${style.gradient} ${
          isEquipped ? "border-purple-500 ring-1 ring-purple-500" : "border-zinc-800"
        }`}
      >
        <Icon className={`h-4 w-4 shrink-0 ${textClass}`} strokeWidth={2.2} />
        <span className={style.text.startsWith("bg-") ? style.text : textClass}>
          {title}
        </span>
      </button>
    )
  })}
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

{showAvatarPicker && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
    <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="mb-4 text-xl font-bold">Choisir un avatar</h2>

      <div className="grid grid-cols-4 gap-3">
        {avatarKeys.map((key) => {
          const isSelected = profile.avatar_key === key

          return (
            <button
              key={key}
              onClick={() => updateAvatar(key)}
              className={`flex items-center justify-center rounded-2xl p-2 transition-all ${
                isSelected
                  ? "bg-purple-600/20 ring-2 ring-purple-500"
                  : "hover:bg-white/5"
              }`}
            >
              <UserAvatar avatarKey={key} size={56} />
            </button>
          )
        })}
      </div>

      <button
        onClick={() => setShowAvatarPicker(false)}
        className="mt-5 w-full rounded-xl border border-zinc-700 p-3 font-bold text-zinc-300"
      >
        Fermer
      </button>
    </div>
  </div>
)}

{showAchievements && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
    onClick={() => setShowAchievements(false)}
  >
    <div
      className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Succès</h2>
        <span className="text-xs font-bold text-zinc-500">
          {claimedCount}/{achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement) => {
          const status = getAchievementStatus(achievement.key)
          const isLocked = status === "locked"
          const isUnclaimed = status === "unclaimed"
          const isClaimed = status === "claimed"
          const style = achievementStyles[achievement.key]
          const Icon = style?.icon ?? Trophy

          return (
            <button
              key={achievement.key}
              onClick={() => isUnclaimed && claimAchievement(achievement.key)}
              disabled={!isUnclaimed || claimingKey === achievement.key}
              className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${
                isUnclaimed
                  ? "border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_20px_rgba(234,179,8,0.15)]"
                  : isClaimed
                  ? "border-zinc-800 bg-zinc-900/40"
                  : "border-zinc-900 bg-black/30"
              }`}
            >
              <div
                className={`relative flex h-14 w-14 items-center justify-center rounded-full ${
                  isLocked ? "bg-zinc-800" : `bg-gradient-to-br ${style.gradient}`
                }`}
                style={!isLocked ? { boxShadow: `0 0 18px ${style.glow}` } : undefined}
              >
                {isLocked ? (
                  <Lock className="h-5 w-5 text-zinc-600" strokeWidth={2.5} />
                ) : (
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                )}

                {isClaimed && (
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-950 bg-green-500">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              <p
                className={`text-[11px] font-semibold leading-tight ${
                  isLocked ? "text-zinc-600" : "text-zinc-200"
                }`}
              >
                {achievement.description}
              </p>

              {isUnclaimed && (
                <span className="rounded-full bg-gradient-to-r from-purple-600 to-red-600 px-3 py-1 text-[10px] font-bold text-white">
                  {claimingKey === achievement.key ? "..." : "Récupérer"}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => setShowAchievements(false)}
        className="mt-4 w-full rounded-xl border border-zinc-700 p-3 font-bold text-zinc-300"
      >
        Fermer
      </button>
    </div>
  </div>
)}

<RewardPopup
  visible={!!claimedAchievement}
  icon={<Trophy className="h-8 w-8 text-white" strokeWidth={2.5} />}
  title={claimedAchievement?.name ?? ""}
  subtitle={claimedAchievement?.rewardText}
/>

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
