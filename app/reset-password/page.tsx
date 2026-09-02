"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"

const errorTranslations: Record<string, string> = {
  "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères",
  "New password should be different from the old password.": "Le nouveau mot de passe doit être différent de l'ancien",
  "Auth session missing!": "Lien invalide ou expiré, redemande un email de réinitialisation",
}

function translateError(message: string) {
  return errorTranslations[message] ?? message
}

export default function ResetPasswordPage() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [validSession, setValidSession] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setValidSession(true)
        setCheckingSession(false)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true)
      }
      setCheckingSession(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleUpdatePassword = async () => {
    setError(null)

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (error) {
      setError(translateError(error.message))
      return
    }

    setSuccess(true)

    setTimeout(() => {
      router.push("/")
    }, 2000)
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
            className="inline-block bg-clip-text text-3xl font-extrabold text-transparent"
            style={{ backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)" }}
          >
            NOUVEAU MOT DE PASSE
          </h1>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-[0_0_30px_rgba(124,58,237,0.15)]">
          {checkingSession ? (
            <p className="text-center text-zinc-400">Vérification du lien...</p>
          ) : !validSession ? (
            <div className="text-center">
              <p className="text-red-400">
                Ce lien est invalide ou a expiré.
              </p>

              <button
                onClick={() => router.push("/login")}
                className="mt-5 text-sm font-bold text-purple-300"
              >
                Retour à la connexion
              </button>
            </div>
          ) : success ? (
            <p className="text-center text-green-400">
              Mot de passe mis à jour ! Redirection...
            </p>
          ) : (
            <>
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mb-4 w-full rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-purple-500"
              />

              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                disabled={loading}
                onClick={handleUpdatePassword}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-red-600 p-4 font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
