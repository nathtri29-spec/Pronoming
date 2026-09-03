"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { UserAvatar } from "@/components/user-avatar"
import { RankBadge } from "@/components/rank-badge"
import { AnimatedNumber } from "@/components/animated-number"
import { getRating, getRankFromRating } from "@/lib/rank"
import { useToast } from "@/components/toast-provider"
import { ClubsSkeleton } from "@/components/clubs-skeleton"
import { useProfile } from "@/components/profile-provider"
import {
  ArrowLeft,
  Crown,
  Users,
  Check,
  X,
  Shield,
  Lock,
  Globe,
  UserPlus,
  LogOut,
  Send,
  MessageCircle,
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
  const [myRole, setMyRole] = useState<"leader" | "member" | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])

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

  async function sendMessage() {
    if (!newMessage.trim()) return

    setSendingMessage(true)

    const { error } = await supabase.rpc("send_club_message", {
      p_content: newMessage.trim(),
    })

    setSendingMessage(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setNewMessage("")
  }

  async function fetchAll() {

    const { data: myMembership } = await supabase
      .from("club_members")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (myMembership) {
      setMyRole(myMembership.role)

      const { data: clubData } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", myMembership.club_id)
        .single()

      setMyClub(clubData)

      const { data: memberRows } = await supabase
        .from("club_members")
        .select("*")
        .eq("club_id", myMembership.club_id)

      const memberIds = (memberRows || []).map((m) => m.user_id)

      if (memberIds.length > 0) {
        const { data: memberProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", memberIds)

        const byId: Record<string, any> = {}
        for (const p of memberProfiles || []) byId[p.id] = p

        setMembers(
          (memberRows || [])
            .map((m) => ({ ...byId[m.user_id], role: m.role }))
            .filter((m) => m.id)
        )
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
      } else {
        setPendingRequests([])
      }
    } else {
      setMyClub(null)
      setMyRole(null)
      setMembers([])
      setPendingRequests([])
      setMessages([])
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

    await fetchAll()
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

    await fetchAll()
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

  if (profileLoading || loading) {
    return <ClubsSkeleton />
  }

  const rankedClubs = [...allClubs].sort(
    (a, b) => (powerByClub[b.id]?.total ?? 0) - (powerByClub[a.id]?.total ?? 0)
  )

  const membersById: Record<string, any> = {}
  for (const m of members) membersById[m.id] = m

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#17091f] via-[#0b0b12] to-black px-4 pb-24 pt-6 text-white">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-300"
      >
        <ArrowLeft className="h-5 w-5" />
        Retour
      </button>

      <h1
        className="inline-block bg-clip-text text-3xl font-extrabold text-transparent"
        style={{ backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)" }}
      >
        CLUBS
      </h1>

      <p className="mt-1 text-sm text-zinc-500">
        Rejoins ou crée un club, discute et grimpe le classement inter-clubs
      </p>

      <div className="mt-6 flex gap-1 rounded-2xl border border-white/10 bg-zinc-950 p-1">
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

        <button
          onClick={() => myClub && setTab("chat")}
          disabled={!myClub}
          className="relative flex-1 rounded-xl py-2.5 text-sm font-bold disabled:opacity-40"
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

      {tab === "club" && (
        <div className="mt-6">
          {myClub ? (
            <div className="rounded-2xl border border-purple-400/30 bg-purple-500/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Mon club
                  </p>
                  <h2 className="text-xl font-black text-white">{myClub.name}</h2>
                </div>

                {myRole === "leader" && (
                  <span className="flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-[10px] font-bold text-yellow-300">
                    <Crown className="h-3 w-3" strokeWidth={2.5} />
                    CHEF
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-zinc-500">
                {members.length} membre{members.length > 1 ? "s" : ""} · Puissance{" "}
                {powerByClub[myClub.id]?.total ?? 0} PR
              </p>

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

              {myRole === "leader" && pendingRequests.length > 0 && (
                <div className="mt-4">
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

              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Membres
                </p>

                <div className="space-y-2">
                  {members
                    .sort((a, b) => getRating(b) - getRating(a))
                    .map((member) => {
                      const memberRank = getRankFromRating(getRating(member))

                      return (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5"
                      >
                        <UserAvatar username={member.username} avatarKey={member.avatar_key} size={32} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-white">
                            {member.username || "Player"}
                            {member.role === "leader" && (
                              <Crown className="ml-1.5 inline h-3 w-3 text-yellow-400" />
                            )}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1">
                            <RankBadge rank={memberRank.name} size={14} intensity={0.4} />
                            <span className={`text-[10px] font-bold ${memberRank.color}`}>
                              {memberRank.name}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-black text-purple-300 tabular-nums">
                            <AnimatedNumber value={getRating(member)} />
                          </p>
                          <p className="text-[9px] font-bold text-zinc-500">PR</p>
                        </div>
                        {myRole === "leader" && member.id !== userId && (
                          <button
                            onClick={() => kick(member.id)}
                            disabled={busy}
                            className="shrink-0 rounded-lg border border-white/15 px-2 py-1 text-[10px] font-bold text-zinc-500"
                          >
                            Exclure
                          </button>
                        )}
                      </div>
                      )
                    })}
                </div>
              </div>

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
                    className="flex-1 rounded-xl border border-red-500/40 py-2.5 text-sm font-bold text-red-400"
                  >
                    Dissoudre
                  </button>
                )}
              </div>
            </div>
          ) : showCreate ? (
            <div className="rounded-2xl border border-purple-400/30 bg-purple-500/5 p-4">
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
            <button
              onClick={() => setShowCreate(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-purple-400/30 bg-purple-500/5 py-4 text-sm font-bold text-purple-300"
            >
              <UserPlus className="h-4 w-4" strokeWidth={2.5} />
              Créer un club ({CREATE_PRICE} pts)
            </button>
          )}
        </div>
      )}

      {tab === "chat" && myClub && (
        <div className="mt-6 flex flex-col">
          <div className="max-h-[55vh] min-h-[55vh] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <MessageCircle className="h-8 w-8 text-zinc-600" strokeWidth={1.5} />
                <p className="text-sm text-zinc-500">Sois le premier à écrire dans le club</p>
              </div>
            ) : (
              messages.map((msg) => {
                const sender = membersById[msg.user_id]
                const isMe = msg.user_id === userId

                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                    <UserAvatar username={sender?.username} avatarKey={sender?.avatar_key} size={28} />

                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                      isMe
                        ? "rounded-br-sm bg-gradient-to-r from-purple-600 to-red-600"
                        : "rounded-bl-sm bg-zinc-800"
                    }`}>
                      {!isMe && (
                        <p className="text-[10px] font-bold text-purple-300">
                          {sender?.username || "Player"}
                        </p>
                      )}
                      <p className="text-sm text-white">{msg.content}</p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Écris un message..."
              maxLength={500}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white outline-none focus:border-purple-500"
            />
            <button
              onClick={sendMessage}
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
                const requestedByMe = myOutgoingRequests.includes(club.id)
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

                    {!myClub && !isMine && (
                      requestedByMe ? (
                        <button
                          onClick={() => cancelRequest(club.id)}
                          disabled={busy}
                          className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1.5 text-[10px] font-bold text-zinc-500"
                        >
                          Annuler
                        </button>
                      ) : (
                        <button
                          onClick={() => join(club.id)}
                          disabled={busy}
                          className="shrink-0 rounded-lg bg-gradient-to-r from-purple-600 to-red-600 px-2.5 py-1.5 text-[10px] font-bold text-white"
                        >
                          {club.join_policy === "request" ? "Demander" : "Rejoindre"}
                        </button>
                      )
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
