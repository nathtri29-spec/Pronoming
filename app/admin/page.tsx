"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AdminPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [tab, setTab] = useState<"pending" | "resolved">("pending")
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [season, setSeason] = useState<any>(null)
  const [closingSeason, setClosingSeason] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  function showSuccess(message: string) {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 2500)
  }

  useEffect(() => {
    checkAccess()
  }, [])

  async function checkAccess() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace("/login")
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      router.replace("/")
      return
    }

    setCheckingAccess(false)
    fetchMatches()
    fetchSeason()
  }

  async function fetchMatches() {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("start_time", { ascending: true })

    if (data) {
      setMatches(data)
    }
  }

  async function fetchSeason() {
    const { data } = await supabase
      .from("seasons")
      .select("*")
      .eq("status", "active")
      .order("number", { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setSeason(data)
    }
  }

  async function closeSeason() {
    if (
      !confirm(
        "Clôturer la saison ? Le rang de fin de saison sera enregistré pour tout le monde, un titre sera distribué selon le rang atteint, et le PR de chacun sera rapproché du milieu. Cette action est irréversible."
      )
    ) {
      return
    }

    setClosingSeason(true)

    const closedNumber = season?.number

    const { error } = await supabase.rpc("close_season")

    setClosingSeason(false)

    if (error) {
      alert(error.message)
      return
    }

    fetchSeason()
    showSuccess(`Saison ${closedNumber} clôturée`)
  }

  async function resolveMatch(matchId: string, winner: string) {
    setResolvingId(matchId)

    const { error } = await supabase.rpc("resolve_match", {
      p_match_id: matchId,
      p_winner: winner,
    })

    setResolvingId(null)

    if (error) {
      alert(error.message)
      return
    }

    fetchMatches()
    showSuccess(`${winner} déclaré vainqueur`)
  }

  if (checkingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Vérification des accès...
      </div>
    )
  }

  const pendingCount = matches.filter((match) => !match.winner).length
const resolvedCount = matches.filter((match) => !!match.winner).length

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1
        className="inline-block bg-clip-text text-4xl font-bold text-transparent mb-6"
        style={{
          backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)",
        }}
      >
        Admin Panel
      </h1>

      {successMessage && (
        <div className="mb-6 rounded-xl border border-green-400/40 bg-green-500/10 px-4 py-3 font-bold text-green-400">
          ✓ {successMessage}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between rounded-xl bg-zinc-900 p-4">
        <div>
          <p className="text-sm text-zinc-400">Saison en cours</p>
          <p className="text-xl font-bold">
            {season ? `Saison ${season.number}` : "Chargement..."}
          </p>
        </div>

        <button
          disabled={!season || closingSeason}
          onClick={closeSeason}
          className="rounded bg-red-600 px-3 py-2 font-bold disabled:opacity-40"
        >
          {closingSeason ? "Clôture..." : "Clôturer la saison"}
        </button>
      </div>

<div className="mb-6 flex gap-2">
  <button
    onClick={() => setTab("pending")}
    className={`rounded-full px-4 py-2 font-bold ${
      tab === "pending"
        ? "bg-purple-600 text-white"
        : "bg-zinc-900 text-zinc-400"
    }`}
  >
    À résoudre ({pendingCount})
  </button>

  <button
    onClick={() => setTab("resolved")}
    className={`rounded-full px-4 py-2 font-bold ${
      tab === "resolved"
        ? "bg-purple-600 text-white"
        : "bg-zinc-900 text-zinc-400"
    }`}
  >
    Résolus ({resolvedCount})
  </button>
</div>

      {matches
  .filter((match) =>
    tab === "pending"
      ? !match.winner
      : !!match.winner
  )
  .map((match) => (
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

          <div className="mt-3 flex gap-2">
            <button
              disabled={!!match.winner || resolvingId === match.id}
              className="bg-purple-600 px-3 py-2 rounded disabled:opacity-40"
              onClick={() => resolveMatch(match.id, match.team_a)}
            >
              {resolvingId === match.id ? "Résolution..." : `${match.team_a} gagne`}
            </button>

            <button
              disabled={!!match.winner || resolvingId === match.id}
              className="bg-red-600 px-3 py-2 rounded disabled:opacity-40"
              onClick={() => resolveMatch(match.id, match.team_b)}
            >
              {resolvingId === match.id ? "Résolution..." : `${match.team_b} gagne`}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}