"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Sparkles, Tag } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { UserAvatar } from "@/components/user-avatar"
import { avatarEmblems, avatarKeys } from "@/lib/avatars"
import { getTitleStyle } from "@/lib/title-styles"

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 8 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, bounce: 0.4, duration: 0.5 },
  },
}

export default function PersonnalisationPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace("/login")
      return
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    setProfile(data)
    setLoading(false)
  }

  async function updateAvatar(key: string) {
    if (!profile) return

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_key: key })
      .eq("id", profile.id)

    if (error) {
      alert(error.message)
      return
    }

    setProfile({ ...profile, avatar_key: key })
  }

  async function updateTitle(title: string) {
    if (!profile) return

    const { error } = await supabase
      .from("profiles")
      .update({ selected_title: title })
      .eq("id", profile.id)

    if (error) {
      alert(error.message)
      return
    }

    setProfile({ ...profile, selected_title: title })
  }

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Chargement...
      </div>
    )
  }

  const ownedTitles = profile.owned_titles
    ? JSON.parse(profile.owned_titles)
    : ["Rookie Predictor"]

  const previewStyle = getTitleStyle(profile.selected_title)
  const PreviewIcon = previewStyle.icon
  const previewIconColor = previewStyle.text.startsWith("bg-") ? "text-pink-300" : previewStyle.text

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#17091f] via-[#0b0b12] to-black px-4 pb-24 pt-6 text-white">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-300"
      >
        <ArrowLeft className="h-5 w-5" />
        Retour
      </button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="inline-block bg-clip-text text-3xl font-extrabold text-transparent"
            style={{ backgroundImage: "linear-gradient(to right, #c084fc, #dc2626 80%)" }}
          >
            PERSONNALISATION
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Choisis ton avatar et le titre affiché sur ton profil
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1.5 pt-1">
          <motion.div
            key={profile.avatar_key}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.4 }}
          >
            <UserAvatar username={profile.username} avatarKey={profile.avatar_key} size={56} />
          </motion.div>

          <motion.div
            key={profile.selected_title}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex max-w-[96px] items-center gap-1 rounded-full border border-white/10 bg-gradient-to-r px-2 py-1 ${previewStyle.gradient}`}
          >
            <PreviewIcon className={`h-3 w-3 shrink-0 ${previewIconColor}`} strokeWidth={2.5} />
            <span className={`truncate text-[9px] font-extrabold uppercase tracking-wide ${previewStyle.text}`}>
              {profile.selected_title || "Rookie Predictor"}
            </span>
          </motion.div>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400" strokeWidth={2.5} />
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
            Avatar
          </h2>
        </div>

        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-4 gap-3"
        >
          {avatarKeys.map((key) => {
            const isSelected = profile.avatar_key === key
            const emblem = avatarEmblems[key]

            return (
              <motion.button
                key={key}
                variants={itemVariants}
                whileTap={{ scale: 0.9 }}
                onClick={() => updateAvatar(key)}
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-colors ${
                  isSelected ? "border-white/20 bg-white/[0.04]" : "border-transparent"
                }`}
                style={isSelected ? { boxShadow: emblem.glow, background: emblem.bg } : undefined}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.6, duration: 0.4 }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-red-500 shadow-[0_0_10px_rgba(168,85,247,0.7)]"
                  >
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </motion.div>
                )}

                <UserAvatar avatarKey={key} size={60} />

                <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                  {emblem.label}
                </span>
              </motion.button>
            )
          })}
        </motion.div>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4 text-purple-400" strokeWidth={2.5} />
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
            Titres
          </h2>
        </div>

        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="space-y-2.5"
        >
          {ownedTitles.map((title: string) => {
            const style = getTitleStyle(title)
            const Icon = style.icon
            const isEquipped = profile.selected_title === title
            const textClass = style.text.startsWith("bg-") ? "text-pink-300" : style.text

            return (
              <motion.button
                key={title}
                variants={itemVariants}
                whileTap={{ scale: 0.97 }}
                onClick={() => updateTitle(title)}
                className={`flex w-full items-center gap-3 rounded-xl border bg-gradient-to-r p-4 text-left font-bold ${style.gradient} ${
                  isEquipped ? "border-white/25" : "border-zinc-800"
                }`}
                style={{ boxShadow: isEquipped ? `0 0 24px ${style.glow}` : undefined }}
              >
                <Icon className={`h-5 w-5 shrink-0 ${textClass}`} strokeWidth={2.2} />

                <span className={`flex-1 ${style.text.startsWith("bg-") ? style.text : textClass}`}>
                  {title}
                </span>

                {isEquipped && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.6, duration: 0.4 }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-red-500"
                  >
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
