"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { UserAvatar } from "@/components/user-avatar"
import { RankBadge } from "@/components/rank-badge"
import { AnimatedNumber } from "@/components/animated-number"
import { getRating, getRankFromRating } from "@/lib/rank"
import { ArrowLeft, Search, UserPlus, Check, X, Users } from "lucide-react"
import { useToast } from "@/components/toast-provider"
import { FriendsSkeleton } from "@/components/friends-skeleton"
import { useProfile } from "@/components/profile-provider"

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

type Relation = "none" | "pending_outgoing" | "pending_incoming" | "accepted"

export default function FriendsPage() {
  const router = useRouter()
  const toast = useToast()
  const { user, profile, loading: profileLoading } = useProfile()
  const userId = user?.id ?? null
  const [loading, setLoading] = useState(true)
  const [friendships, setFriendships] = useState<any[]>([])
  const [profilesById, setProfilesById] = useState<Record<string, any>>({})
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [actingOn, setActingOn] = useState<string | null>(null)

  useEffect(() => {
    if (!profileLoading && !user) {
      router.replace("/login")
      return
    }

    if (user) fetchAll()
  }, [user, profileLoading, router])

  async function fetchAll() {
    const { data: friendshipsData } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

    const rows = friendshipsData || []
    setFriendships(rows)

    const otherIds = Array.from(
      new Set(rows.map((r) => (r.requester_id === user.id ? r.addressee_id : r.requester_id)))
    )

    if (otherIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", otherIds)

      const map: Record<string, any> = {}
      for (const p of profilesData || []) map[p.id] = p
      setProfilesById(map)
    }

    setLoading(false)
  }

  function relationWith(otherId: string): Relation {
    const row = friendships.find(
      (f) => f.requester_id === otherId || f.addressee_id === otherId
    )

    if (!row) return "none"
    if (row.status === "accepted") return "accepted"
    if (row.requester_id === userId) return "pending_outgoing"
    return "pending_incoming"
  }

  async function runSearch(q: string) {
    setQuery(q)

    if (!q.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${q.trim()}%`)
      .neq("id", userId ?? "")
      .limit(20)

    setSearchResults(data || [])
    setSearching(false)
  }

  async function sendRequest(otherId: string) {
    setActingOn(otherId)

    const { error } = await supabase.rpc("send_friend_request", {
      p_addressee_id: otherId,
    })

    setActingOn(null)

    if (error) {
      toast.error(error.message)
      return
    }

    await fetchAll()
  }

  async function respond(requesterId: string, accept: boolean) {
    setActingOn(requesterId)

    const { error } = await supabase.rpc("respond_friend_request", {
      p_requester_id: requesterId,
      p_accept: accept,
    })

    setActingOn(null)

    if (error) {
      toast.error(error.message)
      return
    }

    await fetchAll()
  }

  async function unfriend(otherId: string) {
    setActingOn(otherId)

    const { error } = await supabase.rpc("remove_friend", {
      p_other_id: otherId,
    })

    setActingOn(null)

    if (error) {
      toast.error(error.message)
      return
    }

    await fetchAll()
  }

  if (profileLoading || loading) {
    return <FriendsSkeleton />
  }

  const incoming = friendships.filter(
    (f) => f.status === "pending" && f.addressee_id === userId
  )
  const accepted = friendships.filter((f) => f.status === "accepted")

  const rankedFriends = [
    ...(profile ? [profile] : []),
    ...accepted
      .map((f) => profilesById[f.requester_id === userId ? f.addressee_id : f.requester_id])
      .filter(Boolean),
  ].sort((a, b) => getRating(b) - getRating(a))

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#17091f] via-[#0b0b12] to-black px-4 pb-24 pt-6 text-white">
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
        AMIS
      </h1>

      <p className="mt-1 text-sm text-zinc-500">
        Cherche un joueur par pseudo et gère tes demandes
      </p>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => runSearch(e.target.value)}
          placeholder="Chercher un pseudo..."
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 pl-10 pr-4 text-white outline-none focus:border-purple-500"
        />
      </div>

      {query.trim() ? (
        <div className="mt-5">
          {searching ? (
            <p className="text-sm text-zinc-500">Recherche...</p>
          ) : searchResults.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun joueur trouvé</p>
          ) : (
            <motion.div variants={gridVariants} initial="hidden" animate="show" className="space-y-2.5">
              {searchResults.map((player) => {
                const relation = relationWith(player.id)
                const rank = getRankFromRating(getRating(player))
                const busy = actingOn === player.id

                return (
                  <motion.div
                    key={player.id}
                    variants={itemVariants}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/90 p-3"
                  >
                    <button
                      onClick={() => router.push(`/profile/${player.id}`)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <UserAvatar username={player.username} avatarKey={player.avatar_key} size={44} />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">
                          {player.username || "Player"}
                        </p>

                        <div className="mt-0.5 flex items-center gap-1">
                          <RankBadge rank={rank.name} size={16} intensity={0.4} />
                          <span className={`text-xs font-bold ${rank.color}`}>{rank.name}</span>
                        </div>
                      </div>
                    </button>

                    {relation === "none" && (
                      <button
                        onClick={() => sendRequest(player.id)}
                        disabled={busy}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-red-600 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        <UserPlus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Ajouter
                      </button>
                    )}

                    {relation === "pending_outgoing" && (
                      <span className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-zinc-500">
                        Envoyée
                      </span>
                    )}

                    {relation === "pending_incoming" && (
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => respond(player.id, true)}
                          disabled={busy}
                          className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-bold text-white"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => respond(player.id, false)}
                          disabled={busy}
                          className="flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-bold text-zinc-400"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={3} />
                        </button>
                      </div>
                    )}

                    {relation === "accepted" && (
                      <span className="shrink-0 rounded-lg border border-purple-400/40 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-300">
                        Ami
                      </span>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      ) : (
        <>
          {incoming.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                Demandes reçues
              </h2>

              <motion.div variants={gridVariants} initial="hidden" animate="show" className="space-y-2.5">
                {incoming.map((f) => {
                  const other = profilesById[f.requester_id]
                  if (!other) return null
                  const busy = actingOn === other.id

                  return (
                    <motion.div
                      key={f.id}
                      variants={itemVariants}
                      className="flex items-center gap-3 rounded-2xl border border-purple-400/30 bg-purple-500/5 p-3"
                    >
                      <UserAvatar username={other.username} avatarKey={other.avatar_key} size={44} />

                      <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">
                        {other.username || "Player"}
                      </p>

                      <div className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => respond(other.id, true)}
                          disabled={busy}
                          className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-bold text-white"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => respond(other.id, false)}
                          disabled={busy}
                          className="flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-bold text-zinc-400"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={3} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          )}

          <div className="mt-6">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
              Classement amis {accepted.length > 0 && `(${accepted.length + 1})`}
            </h2>

            {accepted.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
                <Users className="h-8 w-8 text-zinc-600" strokeWidth={1.5} />
                <p className="text-sm text-zinc-500">
                  Pas encore d'amis — cherche un pseudo pour commencer
                </p>
              </div>
            ) : (
              <motion.div variants={gridVariants} initial="hidden" animate="show" className="space-y-2.5">
                {rankedFriends.map((player, index) => {
                  const isMe = player.id === userId
                  const rank = getRankFromRating(getRating(player))
                  const position = index + 1
                  const busy = actingOn === player.id

                  return (
                    <motion.div
                      key={player.id}
                      variants={itemVariants}
                      className={`flex items-center gap-3 rounded-2xl border bg-zinc-950/90 p-3 ${
                        isMe ? "border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]" : "border-white/10"
                      }`}
                    >
                      <div className="flex w-7 shrink-0 justify-center text-lg font-black">
                        {position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : position}
                      </div>

                      <button
                        onClick={() => !isMe && router.push(`/profile/${player.id}`)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <UserAvatar username={player.username} avatarKey={player.avatar_key} size={44} />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-white">
                            {player.username || "Player"}
                            {isMe && (
                              <span className="ml-2 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-black">
                                TOI
                              </span>
                            )}
                          </p>

                          <div className="mt-0.5 flex items-center gap-1">
                            <RankBadge rank={rank.name} size={16} intensity={0.4} />
                            <span className={`text-xs font-bold ${rank.color}`}>{rank.name}</span>
                          </div>
                        </div>
                      </button>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-purple-300 tabular-nums">
                          <AnimatedNumber value={getRating(player)} />
                        </p>
                        <p className="text-[9px] font-bold text-zinc-500">PR</p>
                      </div>

                      {!isMe && (
                        <button
                          onClick={() => unfriend(player.id)}
                          disabled={busy}
                          className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1.5 text-[10px] font-bold text-zinc-500"
                        >
                          Retirer
                        </button>
                      )}
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
