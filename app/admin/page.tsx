"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminPage() {
  const [matches, setMatches] = useState<any[]>([])

  useEffect(() => {
    fetchMatches()
  }, [])

  async function fetchMatches() {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("start_time", { ascending: true })

    if (data) {
      setMatches(data)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-6">
        Admin Panel
      </h1>

      {matches.map((match) => (
        <div
          key={match.id}
          className="mb-4 rounded-xl bg-zinc-900 p-4"
        >
          <h2 className="text-xl font-bold">
            {match.team_a} vs {match.team_b}
          </h2>

          <p>
            Winner : {match.winner || "Aucun"}
          </p>
        <button
  className="mt-3 bg-green-600 px-3 py-2 rounded"
  onClick={async () => {
    const { data: predictions } = await supabase
      .from("predictions")
      .select("*")
      .eq("match_id", match.id)

    if (!predictions) return

    for (const prediction of predictions) {
        if (prediction.status !== "pending") {
  continue
}
      const status =
        prediction.selected_team === match.winner
          ? "won"
          : "lost"

         if (status === "won") {
  const gain = Math.round(prediction.stake * prediction.odds)

  const { data: profile } = await supabase
    .from("profiles")
    .select("points, xp, level")
    .eq("id", prediction.user_id)
    .single()

  if (profile) {
    const xpGain = Math.round(gain / 10)

    const newXp = profile.xp + xpGain

    let newLevel = profile.level

    while (
      newXp >= (newLevel * (newLevel + 1) * 100) / 2
    ) {
      newLevel++
    }
    await supabase
  .from("predictions")
  .update({ status })
  .eq("id", prediction.id)

    await supabase
      .from("profiles")
      .update({
        points: profile.points + gain,
        xp: newXp,
        level: newLevel,
      })
      .eq("id", prediction.user_id)
  }
}

     
    }

    alert("Prédictions résolues")
  }}
>
  Resolve Predictions
</button>

          <div className="mt-3 flex gap-2">
<button
  className="bg-purple-600 px-3 py-2 rounded"
  onClick={async () => {
    const { error } = await supabase
      .from("matches")
      .update({ winner: match.team_a })
      .eq("id", match.id)

    if (error) {
      alert(error.message)
      return
    }

    fetchMatches()
  }}
>
  {match.team_a} gagne
</button>

  <button
    className="bg-red-600 px-3 py-2 rounded"
    onClick={async () => {
      await supabase
        .from("matches")
        .update({ winner: match.team_b })
        .eq("id", match.id)

      fetchMatches()
    }}
  >
    {match.team_b} gagne
  </button>
</div>
        </div>
      ))}
    </div>
  )
}