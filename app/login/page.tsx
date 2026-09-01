"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"

const errorTranslations: Record<string, string> = {
  "Invalid login credentials": "Email ou mot de passe incorrect",
  "User already registered": "Un compte existe déjà avec cet email",
  "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères",
  "Unable to validate email address: invalid format": "Format d'email invalide",
  "Email not confirmed": "Email non confirmé, vérifie ta boîte mail",
}

function translateError(message: string) {
  return errorTranslations[message] ?? message
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState<"signup" | "login" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSignup = async () => {
    setError(null)
    setLoading("signup")

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(null)

    if (error) {
      setError(translateError(error.message))
      return
    }

    // Le profil (points/xp/level de départ) est créé automatiquement côté
    // serveur (trigger Supabase) dès que le compte est créé — plus besoin
    // de l'insérer nous-mêmes ici, et surtout, plus moyen d'en trafiquer
    // les valeurs de départ depuis le navigateur.

    router.push("/onboarding")
  }

  const handleLogin = async () => {
    setError(null)
    setLoading("login")

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoading(null)
      setError(translateError(error.message))
      return
    }

    const user = data.user

    if (!user) {
      setLoading(null)
      router.push("/")
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single()

    setLoading(null)

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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="mb-10 text-center">
          <img
            src="/pronoming_logo_P_fixed.svg"
            alt="Pronoming"
            width={88}
            height={88}
            className="mx-auto mb-4"
          />

          <h1
            className="inline-block bg-clip-text text-5xl font-extrabold text-transparent"
            style={{ backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)" }}
          >
            PRONOMING
          </h1>

          <p className="mt-3 text-zinc-400">
            Competitive Esports Predictions
          </p>

          <p className="mt-1 text-sm text-zinc-600">
            Quand les pronostics rencontrent le gaming
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
            className="mb-4 w-full rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-purple-500"
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            disabled={loading !== null}
            onClick={handleSignup}
            className="mb-3 w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-400 p-4 font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading === "signup" ? "Création..." : "Créer un compte"}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            disabled={loading !== null}
            onClick={handleLogin}
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 p-4 font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading === "login" ? "Connexion..." : "Se connecter"}
          </motion.button>
        </div>

        <div className="mt-6 text-center text-xs text-zinc-600">
          Aucun argent réel • Jeu de prédictions esport
        </div>
      </motion.div>
    </div>
  )
}
