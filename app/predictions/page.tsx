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
        PRONOSTIQUES
      </h1>

      <p className="mb-8 text-zinc-500">
        Suit toutes t'es prédictions
      </p>

      <div className="my-6 h-px w-full bg-white/10" />

      <div className="mb-6 flex gap-2 overflow-x-auto">
  {[
    { key: "all", label: "Tous" },
    { key: "pending", label: "En attente" },
    { key: "won", label: "Gagnés" },
    { key: "lost", label: "Perdus" },
  ].map((item) => (
    <button
      key={item.key}
      onClick={() => setFilter(item.key)}
      className={`rounded-full px-4 py-2 text-sm font-bold ${
        filter === item.key
          ? "bg-purple-600 text-white"
          : "bg-zinc-900 text-zinc-500"
      }`}
    >
      {item.label}
    </button>
  ))}
</div>

<div className="space-y-4">
  {filteredPredictions.map((prediction) => {
          const isWon = prediction.status === "won"
          const isLost = prediction.status === "lost"

          const gain = Math.round(
            prediction.stake * prediction.odds
          )

          return (
            <div
              key={prediction.id}
              className="border-b border-white/10 pb-4"
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
                <p className="mt-2 font-bold text-green-400">
                  +{gain} pts
                </p>
              )}

              {isLost && (
                <p className="mt-2 font-bold text-red-400">
                  -{prediction.stake} pts
                </p>
              )}
            </div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}