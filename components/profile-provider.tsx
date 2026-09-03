"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

type ProfileContextValue = {
  user: any | null
  profile: any | null
  loading: boolean
  refresh: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

/**
 * Source unique du user + profil courants pour tout le groupe (main).
 * Se re-synchronise silencieusement a chaque changement de page (loading ne
 * repasse jamais a true apres le premier chargement) pour eviter que les
 * badges/points affiches ailleurs (BottomNav, etc.) restent figes.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUser(user)

    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    // Filet de securite : le profil devrait toujours exister (trigger
    // handle_new_user cote Supabase), mais si ce n'est pas le cas ou si
    // l'onboarding n'est pas termine, on redirige quelle que soit la page
    // d'ou vient l'appel (avant, seule la home avait cette protection).
    if (!data) {
      await supabase.from("profiles").insert({
        id: user.id,
        username: user.email?.split("@")[0] || "player",
        points: 1000,
        xp: 0,
        level: 1,
        onboarding_completed: false,
      })

      window.location.replace("/onboarding")
      return
    }

    if (data.onboarding_completed === false) {
      window.location.replace("/onboarding")
      return
    }

    setProfile(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [pathname, refresh])

  return (
    <ProfileContext.Provider value={{ user, profile, loading, refresh }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)

  if (!ctx) {
    throw new Error("useProfile doit etre utilise a l'interieur d'un ProfileProvider")
  }

  return ctx
}
