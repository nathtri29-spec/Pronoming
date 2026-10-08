"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { useParams, useRouter } from "next/navigation"
import {ArrowLeft,Coins,Target,Trophy,Flame,TrendingUp,TrendingDown,Shield,UserPlus,Check,X,} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { RankBadge } from "@/components/rank-badge"
import { getRating, getRankFromRating } from "@/lib/rank"
import { UserAvatar } from "@/components/user-avatar"
import { PublicProfileSkeleton } from "@/components/public-profile-skeleton"
import { useProfile } from "@/components/profile-provider"
import { useToast } from "@/components/toast-provider"

type FriendRelation = "self" | "none" | "pending_outgoing" | "pending_incoming" | "accepted"

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  const { user } = useProfile()
  const profileId = params.id as string

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAllPredictions, setShowAllPredictions] = useState(false)
  const [relation, setRelation] = useState<FriendRelation>("none")
  const [friendBusy, setFriendBusy] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [profileId, user])

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

    const { data: membership } = await supabase
      .from("club_members")
      .select("club_id")
      .eq("user_id", profileId)
      .maybeSingle()

    let club = null

    if (membership) {
      const { data: clubData } = await supabase
        .from("clubs")
        .select("name")
        .eq("id", membership.club_id)
        .maybeSingle()

      club = clubData
    }

    setProfile({
      ...profileData,
      predictions: predictionsData ?? [],
      club,
    })

    if (user) {
      if (user.id === profileId) {
        setRelation("self")
      } else {
        const { data: friendshipRows } = await supabase
          .from("friendships")
          .select("*")
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

        const row = (friendshipRows || []).find(
          (f) => f.requester_id === profileId || f.addressee_id === profileId
        )

        if (!row) setRelation("none")
        else if (row.status === "accepted") setRelation("accepted")
        else if (row.requester_id === user.id) setRelation("pending_outgoing")
        else setRelation("pending_incoming")
      }
    }

    setLoading(false)
  }

  async function sendFriendRequest() {
    setFriendBusy(true)

    const { error } = await supabase.rpc("send_friend_request", {
      p_addressee_id: profileId,
    })

    setFriendBusy(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setRelation("pending_outgoing")
  }

  async function respondFriendRequest(accept: boolean) {
    setFriendBusy(true)

    const { error } = await supabase.rpc("respond_friend_request", {
      p_requester_id: profileId,
      p_accept: accept,
    })

    setFriendBusy(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setRelation(accept ? "accepted" : "none")
  }

  async function cancelFriendRequest() {
    setFriendBusy(true)

    const { error } = await supabase.rpc("remove_friend", {
      p_other_id: profileId,
    })

    setFriendBusy(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setRelation("none")
  }

  if (loading) {
    return <PublicProfileSkeleton />
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

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayResolved = finishedPredictions.filter(
    (prediction: any) =>
      prediction.resolved_at && new Date(prediction.resolved_at) >= todayStart
  )

  const todayPrDelta = todayResolved.reduce(
    (sum: number, prediction: any) => sum + (prediction.rating_delta ?? 0),
    0
  )

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
      </div>

      <section className="relative mt-6 overflow-hidden rounded-[36px] border border-purple-500/40 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-6 text-center shadow-[0_0_45px_rgba(168,85,247,.25)]">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-red-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-fuchsia-500/70 blur-2xl" />

            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-purple-400/60 shadow-[0_0_45px_rgba(217,70,239,.55)]">
              <UserAvatar
                username={profile.username}
                avatarKey={profile.avatar_key}
                size={88}
              />
            </div>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-tight">
            {profile.username || "Player"}
          </h1>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {profile.club && (
              <button
                onClick={() => router.push("/clubs")}
                className="flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300"
              >
                <Shield className="h-3 w-3" strokeWidth={2.5} />
                {profile.club.name}
              </button>
            )}

            {relation === "none" && (
              <button
                onClick={sendFriendRequest}
                disabled={friendBusy}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-red-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
              >
                <UserPlus className="h-3 w-3" strokeWidth={2.5} />
                Ajouter en ami
              </button>
            )}

            {relation === "pending_outgoing" && (
              <button
                onClick={cancelFriendRequest}
                disabled={friendBusy}
                className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-zinc-400"
              >
                Demande envoyée
              </button>
            )}

            {relation === "pending_incoming" && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-400">Veut être ton ami</span>
                <button
                  onClick={() => respondFriendRequest(true)}
                  disabled={friendBusy}
                  className="flex items-center justify-center rounded-full bg-green-600 p-1.5"
                >
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </button>
                <button
                  onClick={() => respondFriendRequest(false)}
                  disabled={friendBusy}
                  className="flex items-center justify-center rounded-full border border-white/15 p-1.5 text-zinc-400"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>
            )}

            {relation === "accepted" && (
              <span className="flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300">
                <Check className="h-3 w-3" strokeWidth={2.5} />
                Ami
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <RankBadge rank={rank.name} size={32} intensity={0.6} />
              <p className={`text-lg font-black uppercase ${rank.color}`}>
                {rank.name}
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <span className="text-sm font-bold text-zinc-300">
                Niveau {profile.level ?? 1}
              </span>
            </div>
          </div>

          <div className="mt-5 w-full max-w-xs rounded-2xl border border-purple-400/50 bg-purple-500/10 p-4 shadow-[0_0_20px_rgba(168,85,247,.2)]">
            <p className="text-3xl font-black leading-none text-white">
              {Math.round(rating)}
              <span className="ml-2 text-lg text-purple-300">PR</span>
            </p>

            <p className="mt-1.5 text-xs font-semibold text-zinc-400">
              Classement dans sa ligue
            </p>
          </div>

          <div className="mt-4 w-full rounded-[24px] border border-white/10 bg-black/30 p-5">
            <p className="mb-4 text-center text-sm font-bold">
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

            <div className="relative h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-red-500 shadow-[0_0_25px_rgba(217,70,239,.6)]"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />

              <div className="absolute inset-0 animate-[shine_3s_linear_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </div>

            <div className="mt-2 flex justify-between text-xs font-bold text-zinc-500">
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

      {todayResolved.length > 0 && (
        <section
          className={`mt-6 rounded-3xl border p-5 ${
            todayPrDelta >= 0
              ? "border-green-400/30 bg-zinc-950 shadow-[0_0_24px_rgba(74,222,128,0.12)]"
              : "border-red-400/30 bg-zinc-950 shadow-[0_0_24px_rgba(248,113,113,0.12)]"
          }`}
        >
          <div className="flex items-center gap-5">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full border ${
                todayPrDelta >= 0
                  ? "border-green-400/40 bg-green-500/10 text-green-400 shadow-[0_0_24px_rgba(74,222,128,0.25)]"
                  : "border-red-400/40 bg-red-500/10 text-red-400 shadow-[0_0_24px_rgba(248,113,113,0.25)]"
              }`}
            >
              {todayPrDelta >= 0 ? (
                <TrendingUp className="h-8 w-8" />
              ) : (
                <TrendingDown className="h-8 w-8" />
              )}
            </div>

            <div>
              <p className="text-sm font-bold uppercase text-zinc-500">
                Évolution du PR
              </p>

              <p className={`text-4xl font-black ${todayPrDelta >= 0 ? "text-green-400" : "text-red-400"}`}>
                {todayPrDelta >= 0 ? "+" : ""}
                {todayPrDelta}
              </p>

              <p className="text-sm font-bold text-zinc-400">
                PR {todayPrDelta >= 0 ? "gagnés" : "perdus"} aujourd’hui
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">Derniers pronostics</h2>

          {predictions.length > 5 && (
            <button
              onClick={() => setShowAllPredictions((prev) => !prev)}
              className="text-sm font-bold text-purple-300"
            >
              {showAllPredictions ? "Voir moins" : "Voir tout"}
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
          {(showAllPredictions ? predictions : predictions.slice(0, 5)).map((prediction: any) => (
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
                prediction.status === "won" || prediction.status === "lost"
                  ? prediction.rating_delta != null
                    ? `${prediction.rating_delta > 0 ? "+" : ""}${prediction.rating_delta} PR`
                    : "—"
                  : "En attente"
              }
              positive={prediction.status === "won"}
            />
          ))}
        </div>
      </section>

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
