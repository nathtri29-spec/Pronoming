"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        username: email.split("@")[0],
        points: 1000,
        xp: 0,
        level: 1,
        onboarding_completed: false,
      })
    }

    router.push("/onboarding")
  }

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    const user = data.user

    if (!user) {
      router.push("/")
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single()

    if (!profile) {
      await supabase.from("profiles").insert({
        id: user.id,
        username: user.email?.split("@")[0] || "player",
        points: 1000,
        xp: 0,
        level: 1,
        onboarding_completed: false,
      })

      router.push("/onboarding")
      return
    }

    if (profile.onboarding_completed === false) {
      router.push("/onboarding")
    } else {
      router.push("/")
    }
  }

  return (
  <div className="flex min-h-screen items-center justify-center bg-black p-6">
    <div className="w-full max-w-md">

      <div className="mb-10 text-center">
        <h1 className="bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-5xl font-extrabold text-transparent">
          PRONOMING
        </h1>

        <p className="mt-3 text-zinc-400">
          Rocket League Esports Predictions
        </p>

        <p className="mt-1 text-sm text-zinc-600">
          Prédisez. Progressez. Dominez.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_0_30px_rgba(124,58,237,0.15)]">

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-purple-500"
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-purple-500"
        />

        <button
          onClick={handleSignup}
          className="mb-3 w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-400 p-4 font-bold text-white transition hover:opacity-90"
        >
          Créer un compte
        </button>

        <button
          onClick={handleLogin}
          className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 p-4 font-bold text-white transition hover:opacity-90"
        >
          Se connecter
        </button>

      </div>

      <div className="mt-6 text-center text-xs text-zinc-600">
        Aucun argent réel • Jeu de prédictions esport
      </div>

    </div>
  </div>
)
}
