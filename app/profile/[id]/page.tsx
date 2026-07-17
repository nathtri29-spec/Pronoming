"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { useParams, useRouter } from "next/navigation"
import {ArrowLeft,Coins,Target,Trophy,Flame,TrendingUp,Flag,MoreHorizontal,} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { BottomNav } from "@/components/bottom-nav"
import { RankBadge } from "@/components/rank-badge"

function getRating(profile: any) {
  return profile.rating ?? Math.min(900 + (profile.xp ?? 0), 3800)
}

function getRankFromRating(rating: number) {
  if (rating >= 3500) return { name: "Legend", color: "text-pink-400", next: null, nextRating: null, floor: 3500 }
  if (rating >= 3000) return { name: "Grandmaster", color: "text-red-400", next: "Legend", nextRating: 3500, floor: 3000 }
  if (rating >= 2600) return { name: "Master", color: "text-orange-400", next: "Grandmaster", nextRating: 3000, floor: 2600 }
  if (rating >= 2200) return { name: "Diamond", color: "text-cyan-400", next: "Master", nextRating: 2600, floor: 2200 }
  if (rating >= 1800) return { name: "Platinum", color: "text-purple-300", next: "Diamond", nextRating: 2200, floor: 1800 }
  if (rating >= 1400) return { name: "Gold", color: "text-yellow-400", next: "Platinum", nextRating: 1800, floor: 1400 }
  if (rating >= 1000) return { name: "Silver", color: "text-zinc-200", next: "Gold", nextRating: 1400, floor: 1000 }

  return { name: "Bronze", color: "text-orange-600", next: "Silver", nextRating: 1000, floor: 0 }
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const profileId = params.id as string

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [profileId])

  async function fetchProfile() {
    setLoading(true)

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single()

    if (profileError) {
      console.log("Erreur profil:", profileError)
      setLoading(false)
      return
    }

    const { data: predictionsData, error: predictionsError } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false })

    if (predictionsError) {
      console.log("Erreur predictions:", predictionsError)
    }

    setProfile({
      ...profileData,
      predictions: predictionsData ?? [],
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Chargement...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Profil introuvable
      </div>
    )
  }

  const rating = getRating(profile)
  const rank = getRankFromRating(rating)

  const progressPercent = rank.nextRating
    ? ((rating - rank.floor) / (rank.nextRating - rank.floor)) * 100
    : 100

  const predictions = profile.predictions ?? []

  const finishedPredictions = predictions.filter(
    (prediction: any) => prediction.status !== "pending"
  )

  const wins = finishedPredictions.filter(
    (prediction: any) => prediction.status === "won"
  ).length

  const totalPredictions = finishedPredictions.length

  const accuracy =
    totalPredictions > 0
      ? ((wins / totalPredictions) * 100).toFixed(1)
      : "0.0"

  let currentStreak = 0

  for (const prediction of finishedPredictions) {
    if (prediction.status === "won") {
      currentStreak++
    } else {
      break
    }
  }

  return (
    <div className="min-h-screen bg-black px-4 pb-24 pt-6 text-white">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-zinc-300"
        >
          <ArrowLeft className="h-5 w-5" />
          Retour
        </button>

        <div className="flex gap-2">
          <button className="rounded-full border border-white/10 bg-zinc-950 p-3 text-zinc-300">
            <Flag className="h-4 w-4" />
          </button>

          <button className="rounded-full border border-white/10 bg-zinc-950 p-3 text-zinc-300">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <section className="relative mt-6 overflow-hidden rounded-[36px] border border-purple-500/40 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-7 shadow-[0_0_45px_rgba(168,85,247,.25)]">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-red-500/15 blur-3xl" />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-fuchsia-500/70 blur-2xl" />

                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-purple-400/60 bg-gradient-to-br from-purple-600 via-fuchsia-500 to-red-500 text-5xl font-black shadow-[0_0_45px_rgba(217,70,239,.55)]">
                  {profile.username?.slice(0, 2).toUpperCase() || "??"}
                </div>
              </div>

              <div className="flex flex-col">
                <h1 className="text-5xl font-black leading-none">
                  {profile.username || "Player"}
                </h1>

                <div className="mt-4 flex items-center gap-4">
                  <RankBadge rank={rank.name} />

                  <div className="flex items-center gap-3">
                    <p className={`text-2xl font-black uppercase ${rank.color}`}>
                      {rank.name}
                    </p>

                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      <span className="text-xl font-bold text-zinc-300">
                        Niveau {profile.level ?? 1}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-7 w-[330px] rounded-[24px] border border-purple-400/50 bg-purple-500/10 p-6 shadow-[0_0_25px_rgba(168,85,247,.25)]">
                  <p className="text-6xl font-black leading-none text-white">
                    {Math.round(rating)}
                    <span className="ml-2 text-purple-300">PR</span>
                  </p>

                  <p className="mt-2 text-base font-semibold text-zinc-400">
                    Classement dans sa ligue
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
            <p className="mb-5 text-center text-lg font-bold">
              {rank.nextRating ? (
                <>
                  Encore{" "}
                  <span className="text-purple-400">
                    {Math.max(0, rank.nextRating - rating)} PR
                  </span>{" "}
                  avant <span className="uppercase">{rank.next}</span>
                </>
              ) : (
                "Rang maximum atteint"
              )}
            </p>

            <div className="relative h-4 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-red-500 shadow-[0_0_25px_rgba(217,70,239,.6)]"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />

              <div className="absolute inset-0 animate-[shine_3s_linear_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </div>

            <div className="mt-3 flex justify-between text-sm font-bold text-zinc-500">
              <span>{rank.floor} PR</span>
              <span>{rank.nextRating ?? rating} PR</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Coins />}
          label="Points"
          value={profile.points ?? 0}
          color="text-yellow-400"
        />

        <StatCard
          icon={<Target />}
          label="Précision"
          value={`${accuracy}%`}
          sub={`${wins} / ${totalPredictions} pronos`}
          color="text-purple-300"
        />

        <StatCard
          icon={<Trophy />}
          label="Pronos gagnés"
          value={wins}
          sub={`Sur ${totalPredictions} pronos`}
          color="text-green-400"
        />

        <StatCard
          icon={<Flame />}
          label="Série actuelle"
          value={currentStreak}
          sub="Victoires"
          color="text-orange-400"
        />
      </div>

      <section className="mt-6 rounded-3xl border border-green-400/30 bg-zinc-950 p-5 shadow-[0_0_24px_rgba(74,222,128,0.12)]">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-green-400/40 bg-green-500/10 text-green-400 shadow-[0_0_24px_rgba(74,222,128,0.25)]">
            <TrendingUp className="h-8 w-8" />
          </div>

          <div>
            <p className="text-sm font-bold uppercase text-zinc-500">
              Évolution du classement
            </p>

            <p className="text-4xl font-black text-green-400">
              +18
            </p>

            <p className="text-sm font-bold text-zinc-400">
              places gagnées aujourd’hui
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">Derniers pronostics</h2>

          <button className="text-sm font-bold text-purple-300">
            Voir tout
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
          {predictions.slice(0, 5).map((prediction: any) => (
            <PredictionRow
              key={prediction.id}
              title={prediction.selected_team ?? "Pronostic"}
              result={
                prediction.status === "won"
                  ? "Victoire"
                  : prediction.status === "lost"
                  ? "Défaite"
                  : "En attente"
              }
              pr={
                prediction.status === "won"
                  ? `+${prediction.stake ?? 0} pts`
                  : prediction.status === "lost"
                  ? `-${prediction.stake ?? 0} pts`
                  : "En attente"
              }
              positive={prediction.status === "won"}
            />
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950 p-4">
      <div className={`mb-3 ${color}`}>{icon}</div>
      <p className="text-xs font-bold uppercase text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      {sub && <p className="mt-1 text-sm font-bold text-zinc-500">{sub}</p>}
    </div>
  )
}

function PredictionRow({
  title,
  result,
  pr,
  positive = false,
}: {
  title: string
  result: string
  pr: string
  positive?: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 p-4 last:border-b-0">
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm text-zinc-500">Rocket League</p>
      </div>

      <div className="text-right">
        <p className={positive ? "font-bold text-green-400" : "font-bold text-red-400"}>
          {result}
        </p>
        <p className={positive ? "text-sm font-bold text-green-400" : "text-sm font-bold text-red-400"}>
          {pr}
        </p>
      </div>
    </div>
  )
}
