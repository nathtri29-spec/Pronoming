"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { UserAvatar } from "@/components/user-avatar"
import { AnimatedNumber } from "@/components/animated-number"
import { useToast } from "@/components/toast-provider"
import { ClubsSkeleton } from "@/components/clubs-skeleton"
import { useProfile } from "@/components/profile-provider"
import { clubInitials, clubColor } from "@/lib/club-colors"
import {
  Shield,
  Lock,
  Globe,
  UserPlus,
  Plus,
  Send,
  MessageCircle,
  ChevronRight,
  Swords,
  Users,
} from "lucide-react"

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
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

const CREATE_PRICE = 5000

type ClubTab = "club" | "chat" | "ranking"

export default function ClubsPage() {
  const router = useRouter()
  const toast = useToast()
  const { user, profile, loading: profileLoading, refresh } = useProfile()
  const userId = user?.id ?? null
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<ClubTab>("club")

  const [myClub, setMyClub] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])

  const [allClubs, setAllClubs] = useState<any[]>([])
  const [powerByClub, setPowerByClub] = useState<Record<number, { total: number; count: number }>>({})
  const [myOutgoingRequests, setMyOutgoingRequests] = useState<number[]>([])

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPolicy, setNewPolicy] = useState<"open" | "request" | "friends_only">("request")
  const [busy, setBusy] = useState(false)

  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [matchesById, setMatchesById] = useState<Record<number, any>>({})
  const [shareableMatches, setShareableMatches] = useState<any[]>([])
  const [myPredictionsByMatch, setMyPredictionsByMatch] = useState<Record<number, any>>({})
  const [showMatchPicker, setShowMatchPicker] = useState(false)

  const [weeklyMvp, setWeeklyMvp] = useState<{ id: string; username: string; avatar_key: string | null; winRate: number } | null>(null)
  const [feedEvents, setFeedEvents] = useState<any[]>([])

  useEffect(() => {
    if (!profileLoading && !user) {
      router.replace("/login")
      return
    }

    if (user) fetchAll()
  }, [user, profileLoading, router])

  useEffect(() => {
    if (!myClub) return

    fetchMessages(myClub.id)

    const channel = supabase
      .channel(`club-chat-${myClub.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "club_messages", filter: `club_id=eq.${myClub.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [myClub?.id])

  useEffect(() => {
    if (tab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, tab])

  async function fetchMessages(clubId: number) {
    const { data } = await supabase
      .from("club_messages")
      .select("*")
      .eq("club_id", clubId)
      .order("created_at", { ascending: true })
      .limit(50)

    setMessages(data || [])
  }

  async function sendMessage(matchId?: number) {
    if (!matchId && !newMessage.trim()) return

    setSendingMessage(true)

    const { error } = await supabase.rpc("send_club_message", {
      p_content: matchId ? "" : newMessage.trim(),
      p_match_id: matchId ?? null,
    })

    setSendingMessage(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setNewMessage("")
    setShowMatchPicker(false)
  }

  async function fetchAll() {
    const { data: myMembership } = await supabase
      .from("club_members")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (myMembership) {
      const { data: clubData } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", myMembership.club_id)
        .single()

      setMyClub(clubData)
      if (tab === "club") setTab("chat")

      const { data: memberRows } = await supabase
        .from("club_members")
        .select("user_id")
        .eq("club_id", myMembership.club_id)

      const memberIds = (memberRows || []).map((m) => m.user_id)

      if (memberIds.length > 0) {
        const { data: memberProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", memberIds)

        setMembers(memberProfiles || [])

        const profileById: Record<string, any> = {}
        for (const p of memberProfiles || []) profileById[p.id] = p

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

        const { data: weekPreds } = await supabase
          .from("predictions")
          .select("id, user_id, status, resolved_at")
          .in("user_id", memberIds)
          .not("resolved_at", "is", null)
          .gte("resolved_at", sevenDaysAgo.toISOString())

        const statsByUser: Record<string, { won: number; total: number }> = {}
        for (const p of weekPreds || []) {
          if (!statsByUser[p.user_id]) statsByUser[p.user_id] = { won: 0, total: 0 }
          statsByUser[p.user_id].total += 1
          if (p.status === "won") statsByUser[p.user_id].won += 1
        }

        let mvpId: string | null = null
        let mvpRate = -1
        for (const [uid, s] of Object.entries(statsByUser)) {
          if (s.total < 2) continue
          const rate = s.won / s.total
          if (rate > mvpRate) {
            mvpRate = rate
            mvpId = uid
          }
        }

        setWeeklyMvp(
          mvpId && profileById[mvpId]
            ? {
                id: mvpId,
                username: profileById[mvpId].username || "Player",
                avatar_key: profileById[mvpId].avatar_key,
                winRate: Math.round(mvpRate * 100),
              }
            : null
        )

        const { data: levelEvents } = await supabase
          .from("profile_level_events")
          .select("id, user_id, new_level, created_at")
          .in("user_id", memberIds)
          .gte("created_at", sevenDaysAgo.toISOString())

        const { data: rankEvents } = await supabase
          .from("profile_rank_events")
          .select("id, user_id, new_rank, created_at")
          .in("user_id", memberIds)
          .gte("created_at", sevenDaysAgo.toISOString())

        const levelupEvents = (levelEvents || []).map((e) => ({
          id: `level-${e.id}`,
          kind: "levelup" as const,
          user_id: e.user_id,
          created_at: e.created_at,
          newLevel: e.new_level,
        }))

        const rankupEvents = (rankEvents || []).map((e) => ({
          id: `rank-${e.id}`,
          kind: "rankup" as const,
          user_id: e.user_id,
          created_at: e.created_at,
          newRank: e.new_rank,
        }))

        setFeedEvents([...levelupEvents, ...rankupEvents])
      }
    } else {
      setMyClub(null)
      setMembers([])
      setMessages([])
      setWeeklyMvp(null)
      setFeedEvents([])
      if (tab === "chat") setTab("club")
    }

    const { data: clubsData } = await supabase.from("clubs").select("*")
    setAllClubs(clubsData || [])

    const { data: allMemberRows } = await supabase
      .from("club_members")
      .select("club_id, user_id")

    const { data: allProfiles } = await supabase.from("profiles").select("id, rating")
    const ratingById: Record<string, number> = {}
    for (const p of allProfiles || []) ratingById[p.id] = p.rating ?? 900

    const power: Record<number, { total: number; count: number }> = {}
    for (const m of allMemberRows || []) {
      if (!power[m.club_id]) power[m.club_id] = { total: 0, count: 0 }
      power[m.club_id].total += ratingById[m.user_id] ?? 900
      power[m.club_id].count += 1
    }
    setPowerByClub(power)

    const { data: myRequests } = await supabase
      .from("club_join_requests")
      .select("club_id")
      .eq("user_id", user.id)

    setMyOutgoingRequests((myRequests || []).map((r) => r.club_id))

    const { data: matchesData } = await supabase
      .from("matches")
      .select("id, team_a, team_b, odds_team_a, odds_team_b, game, winner")

    const byId: Record<number, any> = {}
    for (const m of matchesData || []) byId[m.id] = m
    setMatchesById(byId)
    setShareableMatches((matchesData || []).filter((m) => m.winner === null))

    const { data: myPreds } = await supabase
      .from("predictions")
      .select("match_id, selected_team, odds")
      .eq("user_id", user.id)

    setMyPredictionsByMatch(
      Object.fromEntries((myPreds || []).map((p) => [p.match_id, p]))
    )

    setLoading(false)
  }

  async function createClub() {
    if (!newName.trim()) {
      toast.error("Entre un nom de club")
      return
    }

    setBusy(true)

    const { error } = await supabase.rpc("create_club", {
      p_name: newName.trim(),
      p_join_policy: newPolicy,
    })

    setBusy(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setShowCreate(false)
    setNewName("")
    await refresh()
    await fetchAll()
  }

  async function join(clubId: number) {
    setBusy(true)
    const { error } = await supabase.rpc("join_club", { p_club_id: clubId })
    setBusy(false)

    if (error) {
      toast.error(error.message)
      return
    }

    await fetchAll()
  }

  async function cancelRequest(clubId: number) {
    setBusy(true)
    const { error } = await supabase.rpc("cancel_club_request", { p_club_id: clubId })
    setBusy(false)

    if (error) {
      toast.error(error.message)
      return
    }

    await fetchAll()
  }

  if (profileLoading || loading) {
    return <ClubsSkeleton />
  }

  const rankedClubs = [...allClubs].sort(
    (a, b) => (powerByClub[b.id]?.total ?? 0) - (powerByClub[a.id]?.total ?? 0)
  )

  const membersById: Record<string, any> = {}
  for (const m of members) membersById[m.id] = m

  const timeline = [
    ...messages.map((m) => ({ type: "message" as const, data: m, ts: new Date(m.created_at).getTime() })),
    ...feedEvents.map((e) => ({ type: "feed" as const, data: e, ts: new Date(e.created_at).getTime() })),
  ].sort((a, b) => a.ts - b.ts)

  const suggestedClubs = rankedClubs.slice(0, 3)

  function renderJoinButton(club: any) {
    const requestedByMe = myOutgoingRequests.includes(club.id)

    if (requestedByMe) {
      return (
        <button
          onClick={() => cancelRequest(club.id)}
          disabled={busy}
          className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1.5 text-[10px] font-bold text-zinc-500"
        >
          Annuler
        </button>
      )
    }

    return (
      <button
        onClick={() => join(club.id)}
        disabled={busy}
        className="shrink-0 rounded-lg bg-gradient-to-r from-purple-600 to-red-600 px-2.5 py-1.5 text-[10px] font-bold text-white"
      >
        {club.join_policy === "request" ? "Demander" : "Rejoindre"}
      </button>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black px-4 pb-24 pt-6 text-white">
      {myClub ? (
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
            style={{ background: "linear-gradient(135deg, #7c3aed, #dc2626)" }}
          >
            <Shield className="h-6 w-6 text-white" strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            <button
              onClick={() => router.push("/clubs/membres")}
              className="flex items-center gap-1 text-lg font-black text-white"
            >
              <span className="truncate">{myClub.name}</span>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "#c084fc" }} />
            </button>
            <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
              {powerByClub[myClub.id]?.count ?? members.length} membres
            </p>
          </div>

          {weeklyMvp && (
            <div
              className="flex shrink-0 items-center gap-2 p-2"
              style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(192,132,252,0.3)", borderRadius: "12px" }}
            >
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center text-[8px] font-black text-white"
                style={{ background: "linear-gradient(135deg, #c084fc, #7c3aed)", borderRadius: "5px" }}
              >
                {weeklyMvp.username.slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
                  MVP semaine
                </p>
                <p
                  className="truncate text-xs font-black"
                  style={{
                    backgroundImage: "linear-gradient(to right, #c084fc, #dc2626)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {weeklyMvp.username}
                </p>
                <p className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {weeklyMvp.winRate}% win rate
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <h1
            className="inline-block bg-clip-text text-3xl font-extrabold text-transparent"
            style={{ backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)" }}
          >
            CLUBS
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Rejoins ou crée un club, discute et grimpe le classement inter-clubs
          </p>
        </>
      )}

      <div className="mt-6 flex gap-1 rounded-2xl border border-white/10 bg-zinc-950 p-1">
        {!myClub && (
          <button
            onClick={() => setTab("club")}
            className="relative flex-1 rounded-xl py-2.5 text-sm font-bold"
          >
            {tab === "club" && (
              <motion.div
                layoutId="clubs-tab-indicator"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-red-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className={`relative z-10 ${tab === "club" ? "text-white" : "text-zinc-500"}`}>Club</span>
          </button>
        )}

        {myClub && (
          <button
            onClick={() => setTab("chat")}
            className="relative flex-1 rounded-xl py-2.5 text-sm font-bold"
          >
            {tab === "chat" && (
              <motion.div
                layoutId="clubs-tab-indicator"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-red-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className={`relative z-10 ${tab === "chat" ? "text-white" : "text-zinc-500"}`}>Chat</span>
          </button>
        )}

        <button
          onClick={() => setTab("ranking")}
          className="relative flex-1 rounded-xl py-2.5 text-sm font-bold"
        >
          {tab === "ranking" && (
            <motion.div
              layoutId="clubs-tab-indicator"
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-red-600"
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            />
          )}
          <span className={`relative z-10 ${tab === "ranking" ? "text-white" : "text-zinc-500"}`}>
            Classement
          </span>
        </button>
      </div>

      {tab === "club" && !myClub && (
        <div className="mt-6">
          {showCreate ? (
            <div
              className="p-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(192,132,252,0.18)",
                borderRadius: "14px",
              }}
            >
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom du club"
                maxLength={24}
                className="w-full rounded-xl border border-zinc-700 bg-black p-3 text-white outline-none focus:border-purple-500"
              />

              <p className="mb-2 mt-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                Qui peut rejoindre ?
              </p>

              <div className="flex flex-wrap gap-1.5">
                {(["open", "request", "friends_only"] as const).map((policy) => {
                  const def = policyLabels[policy]
                  const Icon = def.icon
                  const active = newPolicy === policy

                  return (
                    <button
                      key={policy}
                      onClick={() => setNewPolicy(policy)}
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

              <p className="mt-3 text-xs text-zinc-500">
                Coût : {CREATE_PRICE} points (tu as {profile?.points ?? 0})
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={createClub}
                  disabled={busy || (profile?.points ?? 0) < CREATE_PRICE}
                  className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-red-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  Créer
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm font-bold text-zinc-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center pt-4 text-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-[20px]"
                style={{ background: "linear-gradient(135deg, #7c3aed, #dc2626)" }}
              >
                <Shield className="h-10 w-10 text-white" strokeWidth={2} />
              </div>

              <h2 className="mt-5 text-lg font-black uppercase tracking-wide text-white">
                Tu n'as pas encore de club
              </h2>

              <div className="mt-5 flex w-full flex-col gap-2.5">
                <button
                  onClick={() => setTab("ranking")}
                  className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #dc2626)" }}
                >
                  <UserPlus className="h-4 w-4" strokeWidth={2.5} />
                  Rejoindre un club
                </button>

                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl border py-3.5 text-sm font-bold"
                  style={{ borderColor: "#c084fc", color: "#c084fc" }}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Créer mon club
                </button>
              </div>

              {suggestedClubs.length > 0 && (
                <div className="mt-8 w-full text-left">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Clubs suggérés
                  </p>

                  <div className="space-y-2">
                    {suggestedClubs.map((club, index) => {
                      const power = powerByClub[club.id] ?? { total: 0, count: 0 }
                      const colors = clubColor(club.name)

                      return (
                        <div
                          key={club.id}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/90 p-3"
                        >
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                            style={{ background: colors.bg, color: colors.text }}
                          >
                            {clubInitials(club.name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-white">{club.name}</p>
                            <p className="text-[10px] font-bold text-zinc-500">
                              {power.count} membre{power.count > 1 ? "s" : ""} · Rang #{index + 1}
                            </p>
                          </div>

                          {renderJoinButton(club)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "chat" && myClub && (
        <div className="mt-6 flex flex-col">
          <div className="max-h-[55vh] min-h-[55vh] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4">
            {timeline.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <MessageCircle className="h-8 w-8 text-zinc-600" strokeWidth={1.5} />
                <p className="text-sm text-zinc-500">Sois le premier à écrire dans le club</p>
              </div>
            ) : (
              timeline.map((item) => {
                if (item.type === "feed") {
                  const event = item.data
                  const member = membersById[event.user_id]
                  const name = event.user_id === userId ? "Toi" : member?.username || "Un membre"
                  const isRankUp = event.kind === "rankup"
                  const color = isRankUp ? "#fbbf24" : "#c084fc"
                  const lineColor = isRankUp ? "rgba(250,204,21,0.2)" : "rgba(192,132,252,0.2)"
                  const bg = isRankUp ? "rgba(250,204,21,0.08)" : "rgba(192,132,252,0.08)"

                  return (
                    <div key={event.id} className="flex items-center gap-2 py-0.5">
                      <div className="h-px flex-1" style={{ background: lineColor }} />
                      <div
                        className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1"
                        style={{ background: bg, border: `1px solid ${lineColor}` }}
                      >
                        <span className="text-xs" style={{ color }}>{isRankUp ? "⬆" : "★"}</span>
                        <span className="text-[11px] font-semibold text-zinc-300">
                          {isRankUp
                            ? `${name} est monté en rang ${event.newRank} !`
                            : `${name} est passé niveau ${event.newLevel} !`}
                        </span>
                      </div>
                      <div className="h-px flex-1" style={{ background: lineColor }} />
                    </div>
                  )
                }

                const msg = item.data
                const sender = membersById[msg.user_id]
                const isMe = msg.user_id === userId
                const sharedMatch = msg.match_id ? matchesById[msg.match_id] : null
                const myPrediction = msg.match_id ? myPredictionsByMatch[msg.match_id] : null

                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                    <button
                      onClick={() => router.push(`/profile/${msg.user_id}`)}
                      className="shrink-0 overflow-hidden rounded-lg"
                      style={{ width: 30, height: 30 }}
                    >
                      <UserAvatar username={sender?.username} avatarKey={sender?.avatar_key} size={30} />
                    </button>

                    <div className={`flex max-w-[75%] flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                      <p className="px-1 text-[10px] font-bold text-purple-300">
                        {isMe ? "Toi" : sender?.username || "Player"}
                      </p>

                      {msg.kind === "match_share" ? (
                        <div
                          className="rounded-xl p-3"
                          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(192,132,252,0.3)" }}
                        >
                          {sharedMatch ? (
                            <>
                              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#c084fc" }}>
                                {sharedMatch.game ?? "Rocket League"}
                              </p>
                              <p className="mt-1 text-sm font-bold text-white">
                                {sharedMatch.team_a} <span className="text-zinc-500">vs</span> {sharedMatch.team_b}
                              </p>
                              <div className="mt-1.5 flex gap-3 text-[11px] font-semibold text-zinc-400">
                                <span>{sharedMatch.team_a} · {Number(sharedMatch.odds_team_a).toFixed(2)}</span>
                                <span>{sharedMatch.team_b} · {Number(sharedMatch.odds_team_b).toFixed(2)}</span>
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-zinc-500">Match indisponible</p>
                          )}
                        </div>
                      ) : (
                        <div className={`rounded-2xl px-3 py-2 ${
                          isMe
                            ? "rounded-br-sm bg-gradient-to-r from-purple-600 to-red-600"
                            : "rounded-bl-sm"
                        }`}
                        style={!isMe ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" } : undefined}
                        >
                          <p className="text-sm text-white">{msg.content}</p>
                        </div>
                      )}

                      {isMe && msg.kind === "match_share" && myPrediction && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: "rgba(124,58,237,0.15)", color: "#c084fc" }}
                        >
                          Prono posé · {myPrediction.selected_team} · cote {Number(myPrediction.odds).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setShowMatchPicker(true)}
              className="flex shrink-0 items-center justify-center rounded-xl border border-purple-400/40 bg-purple-500/10 px-3 text-purple-300"
            >
              <Swords className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Écris un message..."
              maxLength={500}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white outline-none focus:border-purple-500"
            />
            <button
              onClick={() => sendMessage()}
              disabled={sendingMessage || !newMessage.trim()}
              className="flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-red-600 px-4 disabled:opacity-50"
            >
              <Send className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {tab === "ranking" && (
        <div className="mt-6">
          {rankedClubs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
              <Users className="h-8 w-8 text-zinc-600" strokeWidth={1.5} />
              <p className="text-sm text-zinc-500">Aucun club pour l'instant</p>
            </div>
          ) : (
            <motion.div variants={gridVariants} initial="hidden" animate="show" className="space-y-2.5">
              {rankedClubs.map((club, index) => {
                const position = index + 1
                const power = powerByClub[club.id] ?? { total: 0, count: 0 }
                const isMine = myClub?.id === club.id
                const def = policyLabels[club.join_policy]
                const PolicyIcon = def.icon

                return (
                  <motion.div
                    key={club.id}
                    variants={itemVariants}
                    className={`flex items-center gap-3 rounded-2xl border bg-zinc-950/90 p-4 ${
                      isMine ? "border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]" : "border-white/10"
                    }`}
                  >
                    <div className="flex w-8 shrink-0 justify-center text-lg font-black">
                      {position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : position}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-white">{club.name}</p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
                        <PolicyIcon className="h-3 w-3" />
                        {def.label} · {power.count} membre{power.count > 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black text-purple-300 tabular-nums">
                        <AnimatedNumber value={power.total} />
                      </p>
                      <p className="text-[9px] font-bold text-zinc-500">PR total</p>
                    </div>

                    {!myClub && !isMine && renderJoinButton(club)}
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      )}

      {showMatchPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-end bg-black/80"
          onClick={() => setShowMatchPicker(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[70vh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border-t border-purple-500 bg-zinc-950 p-5"
          >
            <h2 className="text-lg font-extrabold text-white">Partager un match</h2>

            {shareableMatches.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">Aucun match à venir pour l'instant.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {shareableMatches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => sendMessage(m.id)}
                    disabled={sendingMessage}
                    className="w-full rounded-xl p-3 text-left"
                    style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(192,132,252,0.3)" }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#c084fc" }}>
                      {m.game ?? "Rocket League"}
                    </p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {m.team_a} <span className="text-zinc-500">vs</span> {m.team_b}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
