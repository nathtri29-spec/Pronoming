"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Inbox } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { BoostChips } from "@/components/boost-chip"
import { PredictionsSkeleton } from "@/components/predictions-skeleton"
import { useProfile } from "@/components/profile-provider"

export default function PredictionsPage() {
  const router = useRouter()
  const { user, loading: profileLoading } = useProfile()
  const [predictions, setPredictions] = useState<any[]>([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profileLoading && !user) {
      router.replace("/login")
      return
    }

    if (user) fetchPredictions(user.id)
  }, [user, profileLoading, router])

  async function fetchPredictions(userId: string) {
    const { data } = await supabase
      .from("predictions")
      .select(`
        *,
        matches (
          team_a,
          team_b
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (data) {
      setPredictions(data)
    }

    setLoading(false)
  }

  const filteredPredictions = predictions.filter((prediction) => {
  if (filter === "all") return true
  return prediction.status === filter
})

  if (profileLoading || loading) {
    return <PredictionsSkeleton />
  }

  return (
    <div className="min-h-screen bg-black p-6 pb-24 text-white">
        <h1
        className="inline-block bg-clip-text text-4xl font-extrabold text-transparent"
        style={{
          backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)",
        }}
      >
        PRONOSTICS
      </h1>

      <p className="mb-8 text-zinc-500">
        Suit tous tes pronostics
      </p>

      <div className="my-6 h-px w-full bg-white/10" />

      <div className="mb-6 flex flex-wrap gap-2">
  {[
    { key: "all", label: "Tous" },
    { key: "pending", label: "En attente" },
    { key: "won", label: "Gagnés" },
    { key: "lost", label: "Perdus" },
  ].map((item) => (
    <button
      key={item.key}
      onClick={() => setFilter(item.key)}
      className={`rounded-full px-3 py-2 text-sm font-bold transition-all ${
        filter === item.key
          ? "bg-purple-600 text-white"
          : "bg-zinc-900 text-zinc-500"
      }`}
    >
      {item.label}
    </button>
  ))}
</div>

<div className="space-y-3">
  {filteredPredictions.length === 0 && (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
      <Inbox className="h-8 w-8 text-zinc-600" strokeWidth={1.5} />
      <p className="text-sm text-zinc-500">
        {predictions.length === 0
          ? "Tu n'as encore fait aucun pronostic"
          : "Aucun pronostic dans cette catégorie"}
      </p>
      {predictions.length === 0 && (
        <button
          onClick={() => router.push("/")}
          className="rounded-xl bg-gradient-to-r from-purple-600 to-red-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          Voir les matchs
        </button>
      )}
    </div>
  )}

  {filteredPredictions.map((prediction) => {
          const isWon = prediction.status === "won"
          const isLost = prediction.status === "lost"
          const isCancelled = prediction.status === "cancelled"

          let gain = Math.round(prediction.stake * prediction.odds)
          if (prediction.gain_boost_applied) gain = Math.round(gain * 1.2)

          let xpGain = Math.round(gain / 10)
          if (prediction.xp_boost_applied) xpGain = Math.round(xpGain * 1.3)

          let lossXp = 5
          if (prediction.xp_boost_applied) lossXp = Math.round(lossXp * 1.3)

          const insuranceRefund = prediction.insurance_applied
            ? Math.round(prediction.stake * 0.5)
            : 0

          return (
            <div
              key={prediction.id}
              className={`rounded-2xl border p-4 transition-all ${
  isWon
    ? "border-green-400/60 shadow-[0_0_18px_rgba(74,222,128,0.22)]"
    : isLost
    ? "border-red-400/60 shadow-[0_0_18px_rgba(248,113,113,0.18)]"
    : isCancelled
    ? "border-zinc-600/60"
    : "border-purple-400/40 shadow-[0_0_14px_rgba(168,85,247,0.14)]"
}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-bold">
                    {prediction.matches?.team_a}
                    {" vs "}
                    {prediction.matches?.team_b}
                  </p>

                  <p className="text-sm text-zinc-500">
                    Choix : {prediction.selected_team}
                  </p>
                </div>

                <div>
                  {isWon && (
                    <span className="text-green-400">
                     GAGNÉ
                    </span>
                  )}

                  {isLost && (
                    <span className="text-red-400">
                     PERDU
                    </span>
                  )}

                  {isCancelled && (
                    <span className="text-zinc-400">
                     ANNULÉ
                    </span>
                  )}

                  {!isWon && !isLost && !isCancelled && (
                    <span className="text-purple-400">
                     EN ATTENTE
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span>
                  Stake : {prediction.stake}
                </span>

                <span>
                  Odds : {Number(prediction.odds).toFixed(2)}
                </span>
              </div>

              {isWon && (
  <div className="mt-2">
    <p className="font-bold text-green-400">
      +{gain} pts
    </p>

    <p className="text-sm font-bold text-purple-300">
      +{xpGain} XP
    </p>

    {prediction.rating_delta != null && (
      <p className="text-sm font-bold text-red-400">
        +{prediction.rating_delta} PR
      </p>
    )}
  </div>
)}

              {isLost && (
  <div className="mt-2">
    <p className="font-bold text-red-400">
      -{prediction.stake} pts
    </p>

    {insuranceRefund > 0 && (
      <p className="text-sm font-bold text-emerald-400">
        +{insuranceRefund} pts remboursés (assurance)
      </p>
    )}

    <p className="text-sm font-bold text-purple-300">
      +{lossXp} XP
    </p>

    {prediction.rating_delta != null && (
      <p className="text-sm font-bold text-red-400">
        {prediction.rating_delta} PR
      </p>
    )}
  </div>
)}

              {isCancelled && (
                <div className="mt-2">
                  <p className="font-bold text-zinc-400">
                    +{prediction.stake} pts remboursés
                  </p>
                  <p className="text-sm text-zinc-500">
                    Match annulé — boosts éventuels également remboursés
                  </p>
                </div>
              )}

              <BoostChips prediction={prediction} />
            </div>
          )
        })}
      </div>

    </div>
  )
}