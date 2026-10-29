"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { Rocket, Target, Zap, Gem, Trophy } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

const slides = [
  {
    icon: Rocket,
    title: "BIENVENUE",
    text: "Pronoming, la plateforme où tes pronostics esport te font vraiment progresser. Voici comment ça marche, en quelques secondes.",
    highlight: "100% gratuit · Aucune carte bancaire requise",
  },
  {
    icon: Target,
    title: "PRÉDIS & PROGRESSE",
    text: "Choisis le vainqueur des matchs esport, mise tes points virtuels et grimpe dans le classement.",
    highlight: "Aucun argent réel · Points virtuels uniquement",
  },
  {
    icon: Zap,
    title: "XP & NIVEAUX",
    text: "Gagne de l’XP grâce à tes bons pronostics. Plus la cote est élevée, plus le risque peut être récompensé.",
    highlight: "L’XP sert au niveau, aux titres et aux badges",
  },
  {
    icon: Gem,
    title: "POINTS VIRTUELS",
    text: "Tes points servent à miser et à débloquer des titres et récompenses dans le shop.",
    highlight: "Commence avec tes points de départ",
  },
  {
    icon: Trophy,
    title: "SAISON & CLASSEMENT",
    text: "Compare-toi aux autres joueurs sur le leaderboard et vise les meilleurs rangs de la saison.",
    highlight: "Stratégie, régularité et prise de risque comptent",
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const [showUsernameStep, setShowUsernameStep] = useState(false)
  const [username, setUsername] = useState("")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [savingUsername, setSavingUsername] = useState(false)
  const reduceMotion = useReducedMotion()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.username) setUsername(data.username)
        })
    })
  }, [])

  const containerVariants = {
    enter: {},
    center: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.08 },
    },
  }

  const iconVariants = reduceMotion
    ? { enter: { opacity: 1 }, center: { opacity: 1 } }
    : {
        enter: { opacity: 0, scale: 0.4, rotate: -18 },
        center: {
          opacity: 1,
          scale: 1,
          rotate: 0,
          transition: { type: "spring" as const, bounce: 0.5, duration: 0.5 },
        },
      }

  const itemVariants = reduceMotion
    ? { enter: { opacity: 1 }, center: { opacity: 1 } }
    : {
        enter: { opacity: 0, y: 16, x: 20 },
        center: {
          opacity: 1,
          y: 0,
          x: 0,
          transition: { duration: 0.35, ease: "easeOut" as const },
        },
      }

  const slide = slides[step]
  const isLast = step === slides.length - 1
  const SlideIcon = slide.icon

  async function saveUsername() {
    const trimmed = username.trim()

    if (trimmed.length < 2 || trimmed.length > 20) {
      setUsernameError("Le pseudo doit faire entre 2 et 20 caractères")
      return
    }

    setUsernameError(null)
    setSavingUsername(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSavingUsername(false)
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username: trimmed })
      .eq("id", user.id)

    setSavingUsername(false)

    if (error) {
      setUsernameError(error.code === "23505" ? "Ce pseudo est déjà pris" : error.message)
      return
    }

    await finishOnboarding()
  }

  async function finishOnboarding() {
    setIsExiting(true)

    const minDuration = new Promise((resolve) => setTimeout(resolve, reduceMotion ? 150 : 350))

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const updateProfile = user
      ? supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id)
      : Promise.resolve()

    await Promise.all([minDuration, updateProfile])

    router.push("/")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-6 text-center text-white">
      <motion.div
        animate={
          isExiting
            ? reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.94, y: -14 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: "easeIn" }}
        className="flex w-full flex-col items-center"
      >
      {showUsernameStep ? (
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex w-full max-w-sm flex-col items-center"
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/mascot/mascot.PNG"
              alt="Mascotte Pronoming"
              width={200}
              height={200}
              className="h-[180px] w-auto object-contain"
            />
          </motion.div>

          <h1
            className="mt-4 mb-2 inline-block bg-clip-text text-3xl font-extrabold text-transparent"
            style={{ backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)" }}
          >
            CHOISIS TON PSEUDO
          </h1>

          <p className="mb-6 max-w-sm text-zinc-400">
            C'est comme ça que les autres joueurs te reconnaîtront sur le classement, dans les clubs et le chat.
          </p>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            placeholder="Ton pseudo"
            autoFocus
            className="w-full rounded-xl border border-zinc-700 bg-black p-4 text-center text-white outline-none focus:border-purple-500"
          />

          {usernameError && (
            <p className="mt-3 text-sm font-bold text-red-400">{usernameError}</p>
          )}

          <motion.button
            disabled={savingUsername}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={saveUsername}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-red-600 p-4 font-extrabold disabled:opacity-60"
          >
            {savingUsername ? "..." : "ENTRER DANS L’ARÈNE →"}
          </motion.button>
        </motion.div>
      ) : (
        <>
      <div className="mb-6 flex gap-2">
        {slides.map((_, index) => (
          <motion.div
            key={index}
            animate={{
              width: index === step ? 32 : 8,
              backgroundColor: index === step ? "#a855f7" : "#3f3f46",
            }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
            className="h-2 rounded-full"
          />
        ))}
      </div>

      <motion.div
        key={step}
        variants={containerVariants}
        initial="enter"
        animate="center"
        className="flex flex-col items-center"
      >
        <motion.div
          variants={iconVariants}
          className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-purple-600/30 to-red-600/30"
        >
          <SlideIcon className="h-11 w-11 text-purple-200" strokeWidth={2} />
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="mb-4 inline-block bg-clip-text text-3xl font-extrabold text-transparent"
          style={{ backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)" }}
        >
          {slide.title}
        </motion.h1>

        <motion.p variants={itemVariants} className="mb-5 max-w-sm text-zinc-400">
          {slide.text}
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mb-8 rounded-xl border border-purple-500/30 bg-purple-900/20 px-4 py-3 text-sm text-purple-200"
        >
          ✦ {slide.highlight}
        </motion.div>
      </motion.div>

      <motion.button
        disabled={isExiting}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={() => {
          if (isLast) {
            setShowUsernameStep(true)
          } else {
            setStep(step + 1)
          }
        }}
        className="w-full max-w-sm rounded-xl bg-gradient-to-r from-purple-600 to-red-600 p-4 font-extrabold disabled:opacity-60"
      >
        CONTINUER →
      </motion.button>

      {step > 0 && (
        <motion.button
          disabled={isExiting}
          whileTap={{ scale: 0.95 }}
          onClick={finishOnboarding}
          className="mt-4 text-sm text-zinc-500"
        >
          Passer l’introduction
        </motion.button>
      )}
        </>
      )}
      </motion.div>
    </div>
  )
}
