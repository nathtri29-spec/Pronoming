"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { RewardPopup } from "@/components/reward-popup"
import { ShopSkeleton } from "@/components/shop-skeleton"
import { Gem, Gamepad2 } from "lucide-react"

const titles = [
  {
    name: "Rookie Predictor",
    icon: "⭐",
    price: 0,
    description: "Titre de départ",
    color: "text-green-400",
  },
  {
    name: "Risk Taker",
    icon: "⚡",
    price: 500,
    description: "Pour ceux qui osent les grosses cotes",
    color: "text-purple-400",
  },
  {
    name: "Underdog Hunter",
    icon: "🎯",
    price: 1000,
    description: "Spécialiste des outsiders",
    color: "text-orange-400",
  },
  {
    name: "Rocket Analyst",
    icon: "🚀",
    price: 2500,
    description: "Analyse, stratégie, précision",
    color: "text-cyan-400",
  },
  {
    name: "Clutch Master",
    icon: "🔥",
    price: 5000,
    description: "Toujours présent dans les moments chauds",
    color: "text-yellow-400",
  },
  {
    name: "GOAT Predictor",
    icon: "👑",
    price: 10000,
    description: "Le titre ultime",
    color: "text-pink-400",
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

        <div className="grid grid-cols-2 gap-3">
          {titles.map((title) => {
            const owned = profile.owned_titles?.includes(title.name)
            const equipped = profile.selected_title === title.name

            return (
              <div
                key={title.name}
                className="rounded-2xl border border-zinc-800 bg-black/40 p-3"
              >
                <h3 className={`text-sm font-extrabold ${title.color}`}>
                  {title.icon} {title.name}
                </h3>

                <p className="mt-1 min-h-8 text-xs text-zinc-500">
                  {title.description}
                </p>

                <p className="mt-3 flex items-center gap-1 text-sm font-bold text-cyan-300">
                  {title.price === 0 ? (
                    "Gratuit"
                  ) : (
                    <>
                      <Gamepad2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                      {title.price}
                    </>
                  )}
                </p>

                <button
  onClick={() => {
    if (!owned) buyTitle(title)
  }}
  disabled={owned}
  className={`mt-3 w-full rounded-lg px-2 py-2 text-xs font-bold ${
    owned
      ? "border border-purple-500 text-purple-300"
      : "bg-gradient-to-r from-purple-600 to-red-600 text-white"
  }`}
>
  {owned ? "Acheté" : "Acheter"}
</button>
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