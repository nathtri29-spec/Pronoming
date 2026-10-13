"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { UserAvatar } from "@/components/user-avatar"
import { useToast } from "@/components/toast-provider"
import { useProfile } from "@/components/profile-provider"
import { getRating } from "@/lib/rank"
import { ClubMembersSkeleton } from "@/components/club-members-skeleton"
import {
  ArrowLeft,
  Check,
  X,
  Globe,
  Lock,
  Shield,
  LogOut,
  AlertTriangle,
  Pencil,
} from "lucide-react"

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, bounce: 0.3, duration: 0.4 },
  },
}

const policyLabels: Record<string, { label: string; icon: typeof Globe }> = {
  open: { label: "Libre", icon: Globe },
  request: { label: "Sur demande", icon: Shield },
  friends_only: { label: "Amis uniquement", icon: Lock },
}

const PAGE_SIZE = 8

export default function ClubMembersPage() {
  const router = useRouter()
  const toast = useToast()
  const { user, profile, loading: profileLoading, refresh } = useProfile()
  const userId = user?.id ?? null

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [myClub, setMyClub] = useState<any>(null)
  const [myRole, setMyRole] = useState<"leader" | "member" | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [mainGameByMember, setMainGameByMember] = useState<Record<string, string | null>>({})
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [clubRank, setClubRank] = useState<number | null>(null)
  const [winRate, setWinRate] = useState<number | null>(null)
  const [xpTotal, setXpTotal] = useState(0)
  const [showAll, setShowAll] = useState(false)

  const [editingDescription, setEditingDescription] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState("")

  useEffect(() => {
    if (!profileLoading && !user) {
      router.replace("/login")
      return
    }

    if (user) fetchAll()
  }, [user, profileLoading, router])

  async function fetchAll() {
    const { data: myMembership } = await supabase
      .from("club_members")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!myMembership) {
      router.replace("/clubs")
      return
    }

    setMyRole(myMembership.role)

    const { data: clubData } = await supabase
      .from("clubs")
      .select("*")
      .eq("id", myMembership.club_id)
      .single()

    setMyClub(clubData)

    const { data: memberRows } = await supabase
      .from("club_members")
      .select("user_id, role")
      .eq("club_id", myMembership.club_id)

    const memberIds = (memberRows || []).map((m) => m.user_id)

    let memberList: any[] = []

    if (memberIds.length > 0) {
      const { data: memberProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", memberIds)

      const byId: Record<string, any> = {}
      for (const p of memberProfiles || []) byId[p.id] = p

      memberList = (memberRows || [])
        .map((m) => ({ ...byId[m.user_id], role: m.role }))
        .filter((m) => m.id)

      setMembers(memberList)
      setXpTotal(memberList.reduce((sum, m) => sum + (m.xp ?? 0), 0))

      const { data: seasonData } = await supabase
        .from("seasons")
        .select("started_at")
        .eq("status", "active")
        .order("number", { ascending: false })
        .limit(1)
        .maybeSingle()

      const seasonStart = seasonData ? new Date(seasonData.started_at) : new Date(0)

      const { data: allPreds } = await supabase
        .from("predictions")
        .select("user_id, status, resolved_at, matches (game)")
        .in("user_id", memberIds)
        .not("resolved_at", "is", null)

      const resolved = allPreds || []
      const seasonResolved = resolved.filter((p) => new Date(p.resolved_at) >= seasonStart)

      const won = seasonResolved.filter((p) => p.status === "won").length
      setWinRate(seasonResolved.length > 0 ? Math.round((won / seasonResolved.length) * 100) : null)

      const gameCounts: Record<string, Record<string, number>> = {}

      for (const p of resolved) {
        const game = (p as any).matches?.game
        if (game) {
          if (!gameCounts[p.user_id]) gameCounts[p.user_id] = {}
          gameCounts[p.user_id][game] = (gameCounts[p.user_id][game] ?? 0) + 1
        }
      }

      const mainGame: Record<string, string | null> = {}
      for (const id of memberIds) {
        const counts = gameCounts[id]
        if (!counts) {
          mainGame[id] = null
          continue
        }
        mainGame[id] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
      }
      setMainGameByMember(mainGame)
    }

    if (myMembership.role === "leader") {
      const { data: requests } = await supabase
        .from("club_join_requests")
        .select("*")
        .eq("club_id", myMembership.club_id)

      const requesterIds = (requests || []).map((r) => r.user_id)

      if (requesterIds.length > 0) {
        const { data: requesterProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", requesterIds)

        const byId: Record<string, any> = {}
        for (const p of requesterProfiles || []) byId[p.id] = p

        setPendingRequests((requests || []).map((r) => byId[r.user_id]).filter(Boolean))
      } else {
        setPendingRequests([])
      }
    }

    const { data: allClubs } = await supabase.from("clubs").select("id")
    const { data: allMemberRows } = await supabase.from("club_members").select("club_id, user_id")
    const { data: allProfiles } = await supabase.from("profiles").select("id, rating")

    const ratingById: Record<string, number> = {}
    for (const p of allProfiles || []) ratingById[p.id] = p.rating ?? 900

    const power: Record<number, number> = {}
    for (const m of allMemberRows || []) {
      power[m.club_id] = (power[m.club_id] ?? 0) + (ratingById[m.user_id] ?? 900)
    }

    const ranked = (allClubs || [])
      .map((c) => ({ id: c.id, total: power[c.id] ?? 0 }))
      .sort((a, b) => b.total - a.total)

    setClubRank(ranked.findIndex((c) => c.id === myMembership.club_id) + 1)

    setLoading(false)
  }

  async function respondRequest(otherUserId: string, accept: boolean) {
    setBusy(true)
    const { error } = await supabase.rpc("respond_club_request", {
      p_user_id: otherUserId,
      p_accept: accept,
    })
    setBusy(false)

    if (error) {
      toast.error(error.message)
      return
    }

    await fetchAll()
  }

  async function kick(otherUserId: string) {
    setBusy(true)
    const { error } = await supabase.rpc("kick_member", { p_user_id: otherUserId })
    setBusy(false)

    if (error) {
      toast.error(error.message)
      return
    }

    await fetchAll()
  }

  async function leave() {
    setBusy(true)
    const { error } = await supabase.rpc("leave_club")
    setBusy(false)

    if (error) {
      toast.error(error.message)
      return
    }

    await refresh()
    router.replace("/clubs")
  }

  async function disband() {
    if (!window.confirm("Dissoudre le club pour tous les membres ? C'est irréversible.")) return

    setBusy(true)
    const { error } = await supabase.rpc("disband_club")
    setBusy(false)

    if (error) {
      toast.error(error.message)
      return
    }

    await refresh()
    router.replace("/clubs")
  }

  async function updatePolicy(policy: "open" | "request" | "friends_only") {
    setBusy(true)
    const { error } = await supabase.rpc("update_club_join_policy", { p_join_policy: policy })
    setBusy(false)

    if (error) {
      toast.error(error.message)
      return
    }

    await fetchAll()
  }

  async function saveDescription() {
    setBusy(true)
    const { error } = await supabase.rpc("update_club_description", {
      p_description: descriptionDraft,
    })
    setBusy(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setEditingDescription(false)
    await fetchAll()
  }

  if (profileLoading || loading || !myClub) {
    return <ClubMembersSkeleton />
  }

  const sortedMembers = [...members].sort((a, b) => getRating(b) - getRating(a))

  const visibleMembers = showAll ? sortedMembers : sortedMembers.slice(0, PAGE_SIZE)
  const hiddenCount = sortedMembers.length - visibleMembers.length

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 text-white" style={{ background: "#0f001e" }}>
      <button
        onClick={() => router.push("/clubs")}
        className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-300"
      >
        <ArrowLeft className="h-5 w-5" />
        Retour
      </button>

      <h1 className="text-2xl font-black text-white">{myClub.name}</h1>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <StatTile label="Rang" value={clubRank ? `#${clubRank}` : "—"} />
        <StatTile label="Win rate" value={winRate != null ? `${winRate}%` : "—"} />
        <StatTile label="XP total" value={xpTotal} />
        <StatTile label="Membres" value={members.length} />
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
          Membres · classés par PR de la saison
        </p>

        <motion.div variants={gridVariants} initial="hidden" animate="show" className="space-y-2">
          {visibleMembers.map((member, index) => {
            const isMe = member.id === userId
            const isCaptain = member.role === "leader"
            const game = mainGameByMember[member.id]

            return (
              <motion.div
                key={member.id}
                variants={itemVariants}
                className="flex items-center gap-2.5 rounded-xl p-2.5"
                style={
                  isMe
                    ? { background: "rgba(124,58,237,0.1)", border: "1px solid rgba(192,132,252,0.4)" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                <span className="w-5 shrink-0 text-center text-xs font-bold text-zinc-500">{index + 1}</span>

                <div className="relative shrink-0">
                  <UserAvatar username={member.username} avatarKey={member.avatar_key} size={36} />
                  {isCaptain && (
                    <span className="absolute -right-1 -top-1 text-sm">👑</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-bold text-white">
                    {member.username || "Player"}
                    {isCaptain && (
                      <span className="rounded-full bg-purple-600/80 px-1.5 py-0.5 text-[9px] font-black text-white">
                        CAP
                      </span>
                    )}
                    {isMe && (
                      <span className="rounded-full border border-purple-400/40 px-1.5 py-0.5 text-[9px] font-black text-purple-300">
                        TOI
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] font-bold text-zinc-500">
                    Niveau {member.level ?? 1} · {game ?? "—"}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-black" style={{ color: "#c084fc" }}>
                    {getRating(member)}
                  </p>
                  <p className="text-[9px] font-bold text-zinc-500">PR</p>
                </div>

                {myRole === "leader" && !isMe && (
                  <button
                    onClick={() => kick(member.id)}
                    disabled={busy}
                    className="shrink-0 rounded-lg border border-white/15 px-2 py-1 text-[10px] font-bold text-zinc-500"
                  >
                    Exclure
                  </button>
                )}
              </motion.div>
            )
          })}
        </motion.div>

        {hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-2 w-full rounded-xl py-2.5 text-center text-sm font-bold"
            style={{ color: "#c084fc" }}
          >
            + {hiddenCount} autre{hiddenCount > 1 ? "s" : ""} membre{hiddenCount > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {myRole === "leader" && pendingRequests.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            Demandes en attente
          </p>

          <div className="space-y-2">
            {pendingRequests.map((requester) => (
              <div
                key={requester.id}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5"
              >
                <UserAvatar username={requester.username} avatarKey={requester.avatar_key} size={32} />
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">
                  {requester.username || "Player"}
                </p>
                <button
                  onClick={() => respondRequest(requester.id, true)}
                  disabled={busy}
                  className="rounded-lg bg-green-600 p-1.5"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
                <button
                  onClick={() => respondRequest(requester.id, false)}
                  disabled={busy}
                  className="rounded-lg border border-white/15 p-1.5 text-zinc-400"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
          Gestion du club
        </p>

        <div
          className="p-4"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(192,132,252,0.18)",
            borderRadius: "14px",
          }}
        >
          {editingDescription ? (
            <div className="flex items-center gap-1.5">
              <input
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value.slice(0, 120))}
                maxLength={120}
                placeholder="Décris ton club..."
                autoFocus
                className="w-full rounded-lg border border-purple-400/40 bg-black/40 px-2 py-1 text-[12px] text-white outline-none focus:border-purple-400"
              />
              <button
                onClick={saveDescription}
                disabled={busy}
                className="shrink-0 text-[11px] font-bold text-purple-300"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p
                className="truncate flex-1"
                style={{
                  fontSize: "12px",
                  color: "#a0a0c0",
                  fontStyle: myClub.description ? "normal" : "italic",
                }}
              >
                {myClub.description || "Aucune description pour ce club"}
              </p>

              {myRole === "leader" && (
                <button
                  onClick={() => {
                    setDescriptionDraft(myClub.description || "")
                    setEditingDescription(true)
                  }}
                  className="shrink-0 text-zinc-500 hover:text-purple-300"
                >
                  <Pencil className="h-3 w-3" strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}

          {myRole === "leader" && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(["open", "request", "friends_only"] as const).map((policy) => {
                const def = policyLabels[policy]
                const Icon = def.icon
                const active = myClub.join_policy === policy

                return (
                  <button
                    key={policy}
                    onClick={() => updatePolicy(policy)}
                    disabled={busy || active}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                      active
                        ? "border-purple-400 bg-purple-500/20 text-purple-200"
                        : "border-white/15 text-zinc-400"
                    }`}
                  >
                    <Icon className="h-3 w-3" strokeWidth={2.5} />
                    {def.label}
                  </button>
                )
              })}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={leave}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 py-2.5 text-sm font-bold text-zinc-300"
            >
              <LogOut className="h-4 w-4" strokeWidth={2.5} />
              Quitter le club
            </button>

            {myRole === "leader" && (
              <button
                onClick={disband}
                disabled={busy}
                className="flex-1 rounded-xl border border-red-500/40 bg-red-500/5 py-2.5 text-center text-sm font-bold text-red-400"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
                  Dissoudre
                </span>
                <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-red-400/70">
                  Action irréversible
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="p-3.5 text-center"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(192,132,252,0.18)",
        borderRadius: "14px",
      }}
    >
      <p className="text-xl font-black text-white">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
    </div>
  )
}
