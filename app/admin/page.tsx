"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { Calendar, Gamepad2, ShieldAlert, Trophy } from "lucide-react"
import { useToast } from "@/components/toast-provider"

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, bounce: 0.3, duration: 0.4 },
  },
}

export default function AdminPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [tab, setTab] = useState<"pending" | "resolved">("pending")
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [season, setSeason] = useState<any>(null)
  const [closingSeason, setClosingSeason] = useState(false)
  const router = useRouter()
  const toast = useToast()

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
      toast.error(error.message)
      return
    }

    fetchSeason()
    toast.success(`Saison ${closedNumber} clôturée`)
  }

  async function resolveMatch(matchId: string, winner: string) {
    setResolvingId(matchId)

    const { error } = await supabase.rpc("resolve_match", {
      p_match_id: matchId,
      p_winner: winner,
    })

    setResolvingId(null)

    if (error) {
      toast.error(error.message)
      return
    }

    fetchMatches()
    toast.success(`${winner} déclaré vainqueur`)
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

  const filteredMatches = matches.filter((match) =>
    tab === "pending" ? !match.winner : !!match.winner
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#17091f] via-[#0b0b12] to-black p-6 text-white">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-6 w-6 text-red-400" strokeWidth={2.2} />
        <h1
          className="inline-block bg-clip-text text-3xl font-extrabold text-transparent"
          style={{
            backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)",
          }}
        >
          ADMIN
        </h1>
      </div>

      <p className="mt-1 text-sm text-zinc-500">
        Résous les matchs et gère les saisons
      </p>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-purple-400/30 bg-purple-500/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-400/40 bg-purple-500/10 text-purple-300">
            <Calendar className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Saison en cours
            </p>
            <p className="text-xl font-black text-white">
              {season ? `Saison ${season.number}` : "Chargement..."}
            </p>
          </div>
        </div>

        <button
          disabled={!season || closingSeason}
          onClick={closeSeason}
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400 disabled:opacity-40"
        >
          {closingSeason ? "Clôture..." : "Clôturer"}
        </button>
      </div>

      <div className="mt-6 flex gap-1 rounded-2xl border border-white/10 bg-zinc-950 p-1">
        <button
          onClick={() => setTab("pending")}
          className={`relative flex-1 rounded-xl py-2.5 text-sm font-bold ${
            tab === "pending" ? "bg-purple-600 text-white" : "text-zinc-500"
          }`}
        >
          À résoudre ({pendingCount})
        </button>

        <button
          onClick={() => setTab("resolved")}
          className={`relative flex-1 rounded-xl py-2.5 text-sm font-bold ${
            tab === "resolved" ? "bg-purple-600 text-white" : "text-zinc-500"
          }`}
        >
          Résolus ({resolvedCount})
        </button>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
          <p className="text-sm text-zinc-500">
            {tab === "pending" ? "Aucun match à résoudre" : "Aucun match résolu"}
          </p>
        </div>
      ) : (
        <motion.div variants={gridVariants} initial="hidden" animate="show" className="mt-6 space-y-3">
          {filteredMatches.map((match) => (
            <motion.div
              key={match.id}
              variants={itemVariants}
              className="rounded-2xl border border-white/10 bg-zinc-950/90 p-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white">
                  {match.team_a} <span className="text-zinc-600">vs</span> {match.team_b}
                </h2>

                {match.winner ? (
                  <span className="flex items-center gap-1 rounded-full border border-green-400/40 bg-green-500/10 px-2.5 py-1 text-[10px] font-bold text-green-300">
                    <Trophy className="h-3 w-3" strokeWidth={2.5} />
                    {match.winner}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-[10px] font-bold text-yellow-300">
                    <Gamepad2 className="h-3 w-3" strokeWidth={2.5} />
                    En attente
                  </span>
                )}
              </div>

              {!match.winner && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    disabled={resolvingId === match.id}
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-400 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                    onClick={() => resolveMatch(match.id, match.team_a)}
                  >
                    {resolvingId === match.id ? "..." : `${match.team_a} gagne`}
                  </button>

                  <button
                    disabled={resolvingId === match.id}
                    className="rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                    onClick={() => resolveMatch(match.id, match.team_b)}
                  >
                    {resolvingId === match.id ? "..." : `${match.team_b} gagne`}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
