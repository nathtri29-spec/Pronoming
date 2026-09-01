"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { RewardPopup } from "@/components/reward-popup"
import { ShopSkeleton } from "@/components/shop-skeleton"
import { Gem, Gamepad2 } from "lucide-react"
import { titleStyles } from "@/lib/title-styles"

const titles = [
  {
    name: "Rookie Predictor",
    price: 0,
    description: "Titre de départ",
  },
  {
    name: "Risk Taker",
    price: 500,
    description: "Pour ceux qui osent les grosses cotes",
  },
  {
    name: "Underdog Hunter",
    price: 1000,
    description: "Spécialiste des outsiders",
  },
  {
    name: "Rocket Analyst",
    price: 2500,
    description: "Analyse, stratégie, précision",
  },
  {
    name: "Clutch Master",
    price: 5000,
    description: "Toujours présent dans les moments chauds",
  },
  {
    name: "GOAT Predictor",
    price: 10000,
    description: "Le titre ultime",
  },
]

export default function ShopPage() {
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const [purchaseAnimation, setPurchaseAnimation] = useState<string | null>(null)

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.replace("/login")
      return
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (data) setProfile(data)
  }

  async function buyTitle(title: any) {
    if (!profile) return

    const ownedTitles = profile.owned_titles
  ? JSON.parse(profile.owned_titles)
  : ["Rookie Predictor"]
    const alreadyOwned = ownedTitles.includes(title.name)

    if (alreadyOwned) {
      await equipTitle(title.name)
      return
    }

    // Vérification locale pour un retour instantané ; le prix réel et le
    // débit des points sont revérifiés côté serveur par buy_title, qui
    // seule fait foi.
    if (profile.points < title.price) {
      alert("Tu n'as pas assez de points")
      return
    }

    const { data, error } = await supabase.rpc("buy_title", {
      p_title_name: title.name,
    })

    if (error) {
      alert(error.message)
      return
    }

    setProfile(data)
  setPurchaseAnimation(title.name)

setTimeout(() => {
  setPurchaseAnimation(null)
}, 3000)

}

  async function equipTitle(titleName: string) {
    if (!profile) return

    const { error } = await supabase
      .from("profiles")
      .update({ selected_title: titleName })
      .eq("id", profile.id)

    if (error) {
      alert(error.message)
      return
    }

    setProfile({
      ...profile,
      selected_title: titleName,
    })
  }

  if (!profile) {
    return <ShopSkeleton />
  }

  return (
    <div className="min-h-screen bg-black p-6 pb-24 text-white">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1
            className="inline-block bg-clip-text text-3xl font-extrabold text-transparent"
            style={{
              backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)",
            }}
          >
            SHOP
          </h1>

          <p className="text-sm text-zinc-500">
            Débloque des titres avec tes points
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/15 px-4 py-2 text-blue-200 shadow-[0_0_14px_rgba(59,130,246,0.18)]">
          <Gamepad2 className="h-4 w-4 text-cyan-300" strokeWidth={2.2} />
          <span className="font-bold">{profile.points}</span>
        </div>
      </div>

      <div className="my-6 h-px w-full bg-white/10" />

      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-4">
        <div className="mb-4">
          <h2 className="text-xl font-extrabold">
            Titres
          </h2>

          <p className="text-xs text-zinc-500">
            Achète et équipe ton titre de profil
          </p>
        </div>

        <div className="space-y-2.5">
          {titles.map((title) => {
            const owned = profile.owned_titles?.includes(title.name)
            const equipped = profile.selected_title === title.name

            const style = titleStyles[title.name]
            const Icon = style.icon
            const iconColor = style.text.startsWith("bg-") ? "text-pink-300" : style.text

            return (
              <div
                key={title.name}
                className={`rounded-2xl bg-gradient-to-r p-[1.5px] ${
                  equipped ? "from-purple-400 to-red-500" : "from-purple-500/40 to-red-500/40"
                }`}
              >
              <div className="flex items-center justify-between gap-4 rounded-[15px] bg-zinc-950 p-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${style.gradient}`}
                    style={{ boxShadow: `0 0 16px ${style.glow}` }}
                  >
                    <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={2.2} />
                  </div>

                  <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`truncate text-base font-extrabold ${style.text}`}>
                      {title.name}
                    </h3>

                    {equipped && (
                      <span className="shrink-0 rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                        ÉQUIPÉ
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {title.description}
                  </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="flex items-center gap-1 text-xs font-bold text-zinc-400">
                    {title.price === 0 ? (
                      "Gratuit"
                    ) : (
                      <>
                        <Gamepad2 className="h-3 w-3" strokeWidth={2.2} />
                        {title.price}
                      </>
                    )}
                  </span>

                  <button
                    onClick={() => buyTitle(title)}
                    disabled={equipped}
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold ${
                      equipped
                        ? "border border-white/15 text-zinc-500"
                        : owned
                        ? "border border-white/25 text-white"
                        : "bg-gradient-to-r from-purple-600 to-red-600 text-white"
                    }`}
                  >
                    {equipped ? "Équipé" : owned ? "Équiper" : "Acheter"}
                  </button>
                </div>
              </div>
              </div>
            )
          })}
        </div>
      </div>
      <RewardPopup
        visible={!!purchaseAnimation}
        icon={<Gem className="h-8 w-8 text-white" strokeWidth={2.5} />}
        title="Titre acheté !"
        subtitle={purchaseAnimation ?? undefined}
      />

    </div>
  )
}