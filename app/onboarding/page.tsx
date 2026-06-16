"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const slides = [
  {
    icon: "🎯",
    title: "PRÉDIS & PROGRESSE",
    text: "Choisis le vainqueur des matchs esport, mise tes points virtuels et grimpe dans le classement.",
    highlight: "Aucun argent réel · Points virtuels uniquement",
  },
  {
    icon: "⚡",
    title: "XP & NIVEAUX",
    text: "Gagne de l’XP grâce à tes bons pronostics. Plus la cote est élevée, plus le risque peut être récompensé.",
    highlight: "L’XP sert au classement, aux titres et aux badges",
  },
  {
    icon: "💎",
    title: "POINTS VIRTUELS",
    text: "Tes points servent à miser, participer à des tirages au sort et plus tard débloquer des récompenses ou bonus.",
    highlight: "Commence avec tes points de départ",
  },
  {
    icon: "🏆",
    title: "SAISON & CLASSEMENT",
    text: "Compare-toi aux autres joueurs sur le leaderboard et vise les meilleurs rangs de la saison.",
    highlight: "Stratégie, régularité et prise de risque comptent",
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const router = useRouter()

  const slide = slides[step]
  const isLast = step === slides.length - 1

  async function finishOnboarding() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id)
    }

    router.push("/")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center text-white">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-purple-600/30 to-red-600/30 text-5xl">
        {slide.icon}
      </div>

      <div className="mb-6 flex gap-2">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === step ? "w-8 bg-purple-500" : "w-2 bg-zinc-700"
            }`}
          />
        ))}
      </div>

      <h1 className="mb-4 bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-3xl font-extrabold text-transparent">
        {slide.title}
      </h1>

      <p className="mb-5 max-w-sm text-zinc-400">
        {slide.text}
      </p>

      <div className="mb-8 rounded-xl border border-purple-500/30 bg-purple-900/20 px-4 py-3 text-sm text-purple-200">
        ✦ {slide.highlight}
      </div>

      <button
        onClick={async () => {
          if (isLast) {
            await finishOnboarding()
          } else {
            setStep(step + 1)
          }
        }}
        className="w-full max-w-sm rounded-xl bg-gradient-to-r from-purple-600 to-red-600 p-4 font-extrabold"
      >
        {isLast ? "ENTRER DANS L’ARÈNE →" : "CONTINUER →"}
      </button>

      {step > 0 && (
        <button
          onClick={finishOnboarding}
          className="mt-4 text-sm text-zinc-500"
        >
          Passer l’introduction
        </button>
      )}
    </div>
  )
}