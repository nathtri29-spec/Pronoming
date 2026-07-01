"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { BottomNav } from "@/components/bottom-nav"

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<any[]>([])
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchPredictions()
  }, [])

  async function fetchPredictions() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
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

    if (data) {
      setPredictions(data)
    }
  }

  const filteredPredictions = predictions.filter((prediction) => {
  if (filter === "all") return true
  return prediction.status === filter
})

  return (
    <div className="min-h-screen bg-black p-6 pb-24 text-white">
        <h1 className="bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-4xl font-extrabold text-transparent">
        PRONOSTICS
      </h1>

      <p className="mb-8 text-zinc-500">
        Suit toutes t'es prédictions
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
  {filteredPredictions.map((prediction) => {
          const isWon = prediction.status === "won"
          const isLost = prediction.status === "lost"

          const gain = Math.round(
            prediction.stake * prediction.odds
          )

          return (
            <div
              key={prediction.id}
              className={`rounded-2xl border p-4 transition-all ${
  isWon
    ? "border-green-400/60 shadow-[0_0_18px_rgba(74,222,128,0.22)]"
    : isLost
    ? "border-red-400/60 shadow-[0_0_18px_rgba(248,113,113,0.18)]"
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
                    Pick : {prediction.selected_team}
                  </p>
                </div>

                <div>
                  {isWon && (
                    <span className="text-green-400">
                     WON
                    </span>
                  )}

                  {isLost && (
                    <span className="text-red-400">
                     LOST
                    </span>
                  )}

                  {!isWon && !isLost && (
                    <span className="text-purple-400">
                     PENDING
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span>
                  Stake : {prediction.stake}
                </span>

                <span>
                  Odds : {prediction.odds}
                </span>
              </div>

              {isWon && (
  <div className="mt-2">
    <p className="font-bold text-green-400">
      +{gain} pts
    </p>

    <p className="text-sm font-bold text-purple-300">
      +{Math.round(gain / 10)} XP
    </p>
  </div>
)}

              {isLost && (
  <div className="mt-2">
    <p className="font-bold text-red-400">
      -{prediction.stake} pts
    </p>

    <p className="text-sm font-bold text-purple-300">
      +5 XP
    </p>
  </div>
)}
            </div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}