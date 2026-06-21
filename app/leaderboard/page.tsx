"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { BottomNav } from "@/components/bottom-nav"

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<any[]>([])

  useEffect(() => {
    fetchPlayers()
  }, [])

  async function fetchPlayers() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("xp", { ascending: false })

    if (data) {
      setPlayers(data)
    }
  }

  return (
    <div className="min-h-screen bg-black p-6 pb-24 text-white">
    <h1 className="bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-4xl font-extrabold text-transparent">
            CLASSEMENT
          </h1>


      <p className="mb-6 text-sm text-zinc-400">
        Classement saisonnier basé sur l’XP
      </p>

      <div className="my-6 h-px w-full bg-white/10" />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            🏆 SEASON RANKINGS
          </h2>

          <span className="rounded-full border border-purple-400/50 bg-purple-500/10 px-4 py-1.5 text-sm font-extrabold tracking-wide text-purple-300 shadow-[0_0_14px_rgba(168,85,247,0.22)]">
            SEASON 1
          </span>
        </div>

        <div className="space-y-3">
          {players.map((player, index) => {
            const rank = index + 1

            const rankStyle =
  rank === 1
    ? "text-yellow-400"
    : rank === 2
    ? "text-gray-300"
    : rank === 3
    ? "text-amber-700"
    : "text-zinc-500"

            return (
              <div
  key={player.id}
  className={`flex items-center gap-3 rounded-2xl border bg-zinc-950/70 p-4 transition-all ${
  rank === 1
    ? "border-yellow-400 bg-yellow-500/10 shadow-[0_0_28px_rgba(250,204,21,0.35)]"
    : rank === 2
    ? "border-zinc-200 bg-zinc-100/10 shadow-[0_0_24px_rgba(255,255,255,0.22)]"
    : rank === 3
    ? "border-orange-400 bg-orange-500/10 shadow-[0_0_28px_rgba(251,146,60,0.32)]"
    : "border-white/20 bg-zinc-950/90"
  }`}
>
                <div
  className={`w-8 text-center text-xl font-extrabold ${rankStyle}`}
>
  {rank}
</div>

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-red-600 font-bold">
                  {player.username?.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1">
                  <p className="font-bold">
                    {player.username}
                  </p>

                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    LV {player.level} · Predictor
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-purple-300">
                    {player.xp} XP
                  </p>

                  <p className="text-xs text-zinc-500">
                    {player.points} pts
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-zinc-500" />
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