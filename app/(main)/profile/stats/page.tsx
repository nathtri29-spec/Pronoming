"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useProfile } from "@/components/profile-provider"
import { StatsSkeleton } from "@/components/stats-skeleton"
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Trophy,
  Skull,
  CalendarDays,
} from "lucide-react"

const CHART_DAYS = 14

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

export default function StatsPage() {
  const router = useRouter()
  const { user, loading: profileLoading } = useProfile()
  const reduceMotion = useReducedMotion()
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)
  const [chartDays, setChartDays] = useState<{ label: string; delta: number }[]>([])
  const [weekTotal, setWeekTotal] = useState(0)
  const [best, setBest] = useState<any>(null)
  const [worst, setWorst] = useState<any>(null)
  const [placesGained, setPlacesGained] = useState<number | null>(null)

  useEffect(() => {
    if (!profileLoading && !user) {
      router.replace("/login")
      return
    }

    if (user) fetchStats(user.id)
  }, [user, profileLoading, router])

  async function fetchStats(userId: string) {
    const { data: predictionsData } = await supabase
      .from("predictions")
      .select("*, matches (team_a, team_b)")
      .eq("user_id", userId)
      .not("resolved_at", "is", null)
      .order("resolved_at", { ascending: true })

    const resolved = predictionsData || []

    setHasData(resolved.length > 0)

    const days: { date: Date; label: string; delta: number }[] = []
    for (let i = CHART_DAYS - 1; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      days.push({
        date: d,
        label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        delta: 0,
      })
    }

    for (const p of resolved) {
      if (!p.resolved_at || p.rating_delta == null) continue
      const resolvedDate = new Date(p.resolved_at)
      resolvedDate.setHours(0, 0, 0, 0)
      const entry = days.find((d) => d.date.getTime() === resolvedDate.getTime())
      if (entry) entry.delta += p.rating_delta
    }

    setChartDays(days.map(({ label, delta }) => ({ label, delta })))

    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

    let week = 0
    let bestPred: any = null
    let worstPred: any = null

    for (const p of resolved) {
      if (p.rating_delta == null || !p.resolved_at) continue

      const resolvedTime = new Date(p.resolved_at).getTime()
      if (resolvedTime >= sevenDaysAgo) week += p.rating_delta

      if (!bestPred || p.rating_delta > bestPred.rating_delta) bestPred = p
      if (!worstPred || p.rating_delta < worstPred.rating_delta) worstPred = p
    }

    setWeekTotal(week)
    setBest(bestPred)
    setWorst(worstPred)

    // Places gagnees au classement global : reconstruit la position d'il y a
    // CHART_DAYS jours en soustrayant les rating_delta obtenus depuis, pour
    // TOUS les joueurs, puis compare les deux classements. Approximation
    // honnete a partir de donnees reelles (pas de valeur inventee) ; peut
    // legerement devier si une saison a ete cloturee dans la fenetre (le
    // rapprochement vers 900 n'est pas trace comme un rating_delta).
    const { data: allProfiles } = await supabase.from("profiles").select("id, rating")

    const windowStart = new Date()
    windowStart.setHours(0, 0, 0, 0)
    windowStart.setDate(windowStart.getDate() - (CHART_DAYS - 1))

    const { data: allRecent } = await supabase
      .from("predictions")
      .select("user_id, rating_delta, resolved_at")
      .not("resolved_at", "is", null)
      .gte("resolved_at", windowStart.toISOString())

    const deltaSumByUser: Record<string, number> = {}
    for (const p of allRecent || []) {
      if (p.rating_delta == null) continue
      deltaSumByUser[p.user_id] = (deltaSumByUser[p.user_id] ?? 0) + p.rating_delta
    }

    const profiles = allProfiles || []

    const currentSorted = [...profiles].sort((a, b) => (b.rating ?? 900) - (a.rating ?? 900))
    const pastSorted = [...profiles]
      .map((p) => ({ id: p.id, pastRating: (p.rating ?? 900) - (deltaSumByUser[p.id] ?? 0) }))
      .sort((a, b) => b.pastRating - a.pastRating)

    const currentIndex = currentSorted.findIndex((p) => p.id === userId)
    const pastIndex = pastSorted.findIndex((p) => p.id === userId)

    setPlacesGained(currentIndex >= 0 && pastIndex >= 0 ? pastIndex - currentIndex : null)

    setLoading(false)
  }

  if (profileLoading || loading) {
    return <StatsSkeleton />
  }

  const maxAbsDelta = Math.max(1, ...chartDays.map((d) => Math.abs(d.delta)))

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 text-white" style={{ background: "#0f001e" }}>
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-300"
      >
        <ArrowLeft className="h-5 w-5" />
        Retour
      </button>

      <h1
        className="inline-block bg-clip-text text-3xl font-extrabold text-transparent"
        style={{ backgroundImage: "linear-gradient(90deg, #c084fc, #dc2626)" }}
      >
        STATISTIQUES
      </h1>

      <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
        Ta progression PR en détail
      </p>

      {placesGained !== null && (
        <div
          className="relative mt-6 overflow-hidden p-5 text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(192,132,252,0.18)",
            borderRadius: "14px",
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-0.5"
            style={{ background: "linear-gradient(90deg, transparent, #c084fc, transparent)" }}
          />

          <div className="flex items-center justify-center gap-2">
            {placesGained > 0 ? (
              <TrendingUp className="h-6 w-6 text-green-400" />
            ) : placesGained < 0 ? (
              <TrendingDown className="h-6 w-6 text-red-400" />
            ) : (
              <ArrowRight className="h-6 w-6 text-white" />
            )}
            <p
              className={`text-[42px] font-black leading-none ${
                placesGained > 0 ? "text-green-400" : placesGained < 0 ? "text-red-400" : "text-white"
              }`}
            >
              {placesGained > 0 ? "+" : ""}
              {placesGained}
            </p>
          </div>

          <div className="mt-2 flex items-center justify-center gap-1.5">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full"
              style={{ background: "rgba(192,132,252,0.15)" }}
            >
              <CalendarDays className="h-3 w-3" style={{ color: "#c084fc" }} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
              place{Math.abs(placesGained) > 1 ? "s" : ""} au classement global sur {CHART_DAYS} jours
            </p>
          </div>
        </div>
      )}

      {hasData ? (
        <div
          className="mt-6 p-4"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(192,132,252,0.18)",
            borderRadius: "14px",
          }}
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
            PR par jour · {CHART_DAYS} derniers jours
          </p>

          <div className="flex items-stretch gap-1">
            {chartDays.map((day, i) => {
              const isLast = i === chartDays.length - 1

              return (
                <div key={i} className="flex flex-1 flex-col items-center">
                  <div className="flex h-16 w-full flex-col justify-end">
                    {day.delta > 0 && (
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${(day.delta / maxAbsDelta) * 100}%`,
                          background: isLast ? "linear-gradient(180deg, #c084fc, #7c3aed)" : "rgba(124,58,237,0.25)",
                          boxShadow: isLast ? "0 0 8px rgba(192,132,252,0.4)" : undefined,
                        }}
                      />
                    )}
                  </div>
                  <div className="h-px w-full" style={{ background: "rgba(255,255,255,0.15)" }} />
                  <div className="flex h-16 w-full flex-col">
                    {day.delta < 0 && (
                      <div
                        className="w-full rounded-b"
                        style={{
                          height: `${(Math.abs(day.delta) / maxAbsDelta) * 100}%`,
                          background: isLast ? "linear-gradient(180deg, #c084fc, #7c3aed)" : "rgba(124,58,237,0.25)",
                          boxShadow: isLast ? "0 0 8px rgba(192,132,252,0.4)" : undefined,
                        }}
                      />
                    )}
                  </div>
                  {i % 3 === 0 && (
                    <p className="mt-1 text-[8px] font-bold" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {day.label}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center">
          <div className="relative mb-5">
            <div
              className="rounded-xl px-4 py-2.5"
              style={{
                background: "rgba(124, 58, 237, 0.15)",
                border: "1px solid #c084fc",
              }}
            >
              <p className="text-[13px] font-bold text-white">
                Aucune stat pour l'instant... je scrolle en attendant tes pronostics !
              </p>
            </div>

            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: "100%",
                width: 0,
                height: 0,
                borderLeft: "7px solid transparent",
                borderRight: "7px solid transparent",
                borderTop: "7px solid #c084fc",
              }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: "calc(100% - 1px)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid rgba(124, 58, 237, 0.15)",
              }}
            />
          </div>

          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/mascot/mascot_phone.png"
              alt="Mascotte Pronoming"
              width={280}
              height={280}
              className="h-[280px] w-auto object-contain"
            />
          </motion.div>
        </div>
      )}

      <motion.div variants={gridVariants} initial="hidden" animate="show" className="mt-6 grid grid-cols-2 gap-3">
        <motion.div
          variants={itemVariants}
          className="relative col-span-2 overflow-hidden p-4"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(192,132,252,0.18)",
            borderRadius: "14px",
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-0.5"
            style={{
              background:
                weekTotal > 0
                  ? "linear-gradient(90deg, transparent, #22c55e, transparent)"
                  : weekTotal < 0
                  ? "linear-gradient(90deg, transparent, #dc2626, transparent)"
                  : "linear-gradient(90deg, transparent, #c084fc, transparent)",
            }}
          />
          <CalendarDays
            className="mb-2 h-5 w-5"
            style={{ color: weekTotal > 0 ? "#22c55e" : weekTotal < 0 ? "#f87171" : "#c084fc" }}
            strokeWidth={2.2}
          />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
            7 jours
          </p>
          <p
            className="mt-1 text-2xl font-black"
            style={{ color: weekTotal > 0 ? "#22c55e" : weekTotal < 0 ? "#f87171" : "#ffffff" }}
          >
            {weekTotal > 0 ? "+" : ""}
            {weekTotal} PR
          </p>
        </motion.div>

        {best && (
          <motion.div
            variants={itemVariants}
            className="relative col-span-2 overflow-hidden p-4"
            style={{
              background: "linear-gradient(135deg, rgba(192,132,252,0.1), rgba(220,38,38,0.08))",
              border: "1px solid rgba(192,132,252,0.25)",
              borderRadius: "14px",
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ background: "linear-gradient(90deg, #c084fc, #dc2626)" }}
            />
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" style={{ color: "#c084fc" }} strokeWidth={2.2} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#c084fc" }}>
                Meilleur prono
              </p>
            </div>
            <p className="mt-2 truncate text-sm font-bold text-white">
              {best.matches?.team_a} vs {best.matches?.team_b}
            </p>
            <p className="text-2xl font-black text-white">+{best.rating_delta} PR</p>
          </motion.div>
        )}

        {worst && worst.rating_delta < 0 && (
          <motion.div
            variants={itemVariants}
            className="relative col-span-2 overflow-hidden p-4"
            style={{
              background: "linear-gradient(135deg, rgba(220,38,38,0.1), rgba(192,132,252,0.08))",
              border: "1px solid rgba(220,38,38,0.25)",
              borderRadius: "14px",
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ background: "linear-gradient(90deg, transparent, #dc2626, transparent)" }}
            />
            <div className="flex items-center gap-2">
              <Skull className="h-5 w-5 text-red-400" strokeWidth={2.2} />
              <p className="text-xs font-bold uppercase tracking-wider text-red-400">Pire prono</p>
            </div>
            <p className="mt-2 truncate text-sm font-bold text-white">
              {worst.matches?.team_a} vs {worst.matches?.team_b}
            </p>
            <p className="text-2xl font-black text-red-400">{worst.rating_delta} PR</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
