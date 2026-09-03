"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { RewardPopup } from "@/components/reward-popup"
import { ShopSkeleton } from "@/components/shop-skeleton"
import { Gem, Gamepad2 } from "lucide-react"
import { titleStyles } from "@/lib/title-styles"
import { boostDefs, boostKeys, type BoostKey } from "@/lib/boost-styles"
import { AnimatedNumber } from "@/components/animated-number"
import { motion } from "framer-motion"
import { useToast } from "@/components/toast-provider"
import { useProfile } from "@/components/profile-provider"

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 6 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, bounce: 0.3, duration: 0.4 },
  },
}

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
  const toast = useToast()
  const router = useRouter()
  const { user, profile, loading, refresh } = useProfile()
  const [pendingBoosts, setPendingBoosts] = useState<any[]>([])
  const [buyingBoost, setBuyingBoost] = useState<BoostKey | null>(null)
  const [activeTab, setActiveTab] = useState<"titres" | "boosts">("titres")

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  useEffect(() => {
    if (profile?.id) loadBoosts()
  }, [profile?.id])

  const [purchaseAnimation, setPurchaseAnimation] = useState<{ title: string; subtitle: string } | null>(null)

  async function loadBoosts() {
    const { data: boostsData } = await supabase
      .from("profile_boosts")
      .select("*")
      .eq("user_id", profile.id)
      .eq("status", "pending")

    setPendingBoosts(boostsData || [])
  }

  async function buyBoost(key: BoostKey) {
    if (!profile) return

    setBuyingBoost(key)

    const { error } = await supabase.rpc("buy_boost", {
      p_boost_type: key,
    })

    setBuyingBoost(null)

    if (error) {
      toast.error(error.message)
      return
    }

    await refresh()
    await loadBoosts()

    setPurchaseAnimation({ title: "Boost activé !", subtitle: boostDefs[key].label })

    setTimeout(() => {
      setPurchaseAnimation(null)
    }, 3000)
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
      toast.error("Tu n'as pas assez de points")
      return
    }

    const { error } = await supabase.rpc("buy_title", {
      p_title_name: title.name,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    await refresh()
  setPurchaseAnimation({ title: "Titre acheté !", subtitle: title.name })

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
      toast.error(error.message)
      return
    }

    await refresh()
  }

  if (loading || !profile) {
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
          <span className="font-bold tabular-nums">
            <AnimatedNumber value={profile.points} />
          </span>
        </div>
      </div>

      <div className="mt-6 flex gap-1 rounded-2xl border border-white/10 bg-zinc-950 p-1">
        {(["titres", "boosts"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative flex-1 rounded-xl py-2.5 text-sm font-bold"
          >
            {activeTab === tab && (
              <motion.div
                layoutId="shop-tab-indicator"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-red-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className={`relative z-10 ${activeTab === tab ? "text-white" : "text-zinc-500"}`}>
              {tab === "titres" ? "Titres" : "Boosts"}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "titres" && (
      <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-4">
        <div className="mb-4">
          <h2 className="text-xl font-extrabold">
            Titres
          </h2>

          <p className="text-xs text-zinc-500">
            Achète et équipe ton titre de profil
          </p>
        </div>

        <motion.div variants={gridVariants} initial="hidden" animate="show" className="space-y-2.5">
          {titles.map((title) => {
            const owned = profile.owned_titles?.includes(title.name)
            const equipped = profile.selected_title === title.name

            const style = titleStyles[title.name]
            const Icon = style.icon
            const iconColor = style.text.startsWith("bg-") ? "text-pink-300" : style.text

            return (
              <motion.div
                key={title.name}
                variants={itemVariants}
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
              </motion.div>
            )
          })}
        </motion.div>
      </div>
      )}

      {activeTab === "boosts" && (
      <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-4">
        <div className="mb-4">
          <h2 className="text-xl font-extrabold">
            Boosts
          </h2>

          <p className="text-xs text-zinc-500">
            Des coups de pouce ponctuels, sans impact sur ton rang compétitif
          </p>
        </div>

        <motion.div variants={gridVariants} initial="hidden" animate="show" className="space-y-2.5">
          {boostKeys.map((key) => {
            const def = boostDefs[key]
            const Icon = def.icon
            const active = pendingBoosts.find((b) => b.boost_type === key)
            const isBuying = buyingBoost === key

            return (
              <motion.div
                key={key}
                variants={itemVariants}
                className={`rounded-2xl bg-gradient-to-r p-[1.5px] ${
                  active ? "from-purple-400 to-red-500" : "from-purple-500/40 to-red-500/40"
                }`}
              >
                <div className="flex items-center justify-between gap-4 rounded-[15px] bg-zinc-950 p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${def.gradient}`}
                      style={{ boxShadow: `0 0 16px ${def.glow}` }}
                    >
                      <Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-extrabold text-white">
                          {def.label}
                        </h3>

                        {active && (
                          <span className="shrink-0 rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                            ACTIF{def.maxUses > 1 ? ` ${active.uses_remaining}/${def.maxUses}` : ""}
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {def.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="flex items-center gap-1 text-xs font-bold text-zinc-400">
                      <Gamepad2 className="h-3 w-3" strokeWidth={2.2} />
                      {def.price}
                    </span>

                    <button
                      onClick={() => buyBoost(key)}
                      disabled={!!active || isBuying}
                      className={`rounded-lg px-4 py-1.5 text-xs font-bold ${
                        active
                          ? "border border-white/15 text-zinc-500"
                          : "bg-gradient-to-r from-purple-600 to-red-600 text-white"
                      }`}
                    >
                      {active ? "Actif" : isBuying ? "..." : "Acheter"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
      )}

      <RewardPopup
        visible={!!purchaseAnimation}
        icon={<Gem className="h-8 w-8 text-white" strokeWidth={2.5} />}
        title={purchaseAnimation?.title ?? ""}
        subtitle={purchaseAnimation?.subtitle}
      />

    </div>
  )
}