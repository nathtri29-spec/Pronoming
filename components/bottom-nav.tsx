"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {House,Trophy,User,Store,Shield} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useProfile } from "@/components/profile-provider"

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useProfile()
  const [clubRequestCount, setClubRequestCount] = useState(0)
  const [profileBadgeCount, setProfileBadgeCount] = useState(0)

  useEffect(() => {
    if (user) fetchBadges(user.id)
  }, [user, pathname])

  async function fetchBadges(userId: string) {
    const { data: club } = await supabase
      .from("clubs")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle()

    if (club) {
      const { count } = await supabase
        .from("club_join_requests")
        .select("id", { count: "exact", head: true })
        .eq("club_id", club.id)

      setClubRequestCount(count ?? 0)
    } else {
      setClubRequestCount(0)
    }

    const { count: unclaimedCount } = await supabase
      .from("profile_achievements")
      .select("achievement_key", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("claimed_at", null)

    const { count: friendRequestCount } = await supabase
      .from("friendships")
      .select("id", { count: "exact", head: true })
      .eq("addressee_id", userId)
      .eq("status", "pending")

    setProfileBadgeCount((unclaimedCount ?? 0) + (friendRequestCount ?? 0))
  }

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/clubs", label: "Clubs", icon: Shield },
  { href: "/leaderboard", label: "Classement", icon: Trophy },
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/profile", label: "Profile", icon: User },
]

  const badgeByHref: Record<string, number> = {
    "/clubs": clubRequestCount,
    "/profile": profileBadgeCount,
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black">
      <div className="mx-auto flex max-w-md justify-around">
        {items.map((item) => {
          const active = pathname === item.href
          const badge = badgeByHref[item.href] ?? 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-bold tracking-wider ${
                active ? "text-purple-400" : "text-zinc-500"
              }`}
            >
              <div className="relative">
                <item.icon
  size={20}
  strokeWidth={2.5}
/>
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </div>
              <span>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
