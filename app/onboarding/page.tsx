"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  const reduceMotion = useReducedMotion()
  const router = useRouter()

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
        onClick={async () => {
          if (isLast) {
            await finishOnboarding()
          } else {
            setStep(step + 1)
          }
        }}
        className="w-full max-w-sm rounded-xl bg-gradient-to-r from-purple-600 to-red-600 p-4 font-extrabold disabled:opacity-60"
      >
        {isLast ? "ENTRER DANS L’ARÈNE →" : "CONTINUER →"}
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
      </motion.div>
    </div>
  )
}
