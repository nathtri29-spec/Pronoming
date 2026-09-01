"use client"

import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"

type Props = {
  rank: string
  size?: number
  /** Force de l'aura, de 0 (invisible) à 1 (pleine puissance). Utile pour
   *  les placements discrets (ex. à côté d'un texte) sans changer les
   *  couleurs ou la mise en scène par palier. */
  intensity?: number
}

type RankTier = {
  src: string
  glow: string
  glowSecondary?: string
  ring?: boolean
  ringColor?: string
  pulseScale: number
  pulseDuration: number
}

const tiers: Record<string, RankTier> = {
  Bronze: {
    src: "/ranks/bronze.png",
    glow: "rgba(194,120,60,0.35)",
    pulseScale: 1.03,
    pulseDuration: 4,
  },
  Silver: {
    src: "/ranks/silver.png",
    glow: "rgba(226,226,230,0.35)",
    pulseScale: 1.04,
    pulseDuration: 3.6,
  },
  Gold: {
    src: "/ranks/gold.png",
    glow: "rgba(250,204,21,0.45)",
    pulseScale: 1.05,
    pulseDuration: 3.2,
  },
  Platinum: {
    src: "/ranks/platinum.png",
    glow: "rgba(168,85,247,0.6)",
    glowSecondary: "rgba(216,180,254,0.35)",
    pulseScale: 1.07,
    pulseDuration: 3,
  },
  Diamond: {
    src: "/ranks/diamond.png",
    glow: "rgba(34,211,238,0.5)",
    pulseScale: 1.07,
    pulseDuration: 2.8,
  },
  Master: {
    // master.png est en réalité l'artwork rouge/noir : l'aura doit suivre
    // les couleurs réelles de l'image, pas le nom du palier.
    src: "/ranks/master.png",
    glow: "rgba(220,38,38,0.5)",
    glowSecondary: "rgba(120,20,20,0.45)",
    ring: true,
    ringColor: "rgba(248,113,113,0.95)",
    pulseScale: 1.08,
    pulseDuration: 2.6,
  },
  Grandmaster: {
    // grandmaster.png est en réalité l'artwork violet/or.
    src: "/ranks/grandmaster.png",
    glow: "rgba(168,85,247,0.5)",
    glowSecondary: "rgba(250,204,21,0.3)",
    ring: true,
    ringColor: "rgba(196,155,255,0.95)",
    pulseScale: 1.09,
    pulseDuration: 2.4,
  },
  Legend: {
    src: "/ranks/legend.png",
    glow: "rgba(250,204,21,0.6)",
    glowSecondary: "rgba(244,114,182,0.45)",
    ring: true,
    ringColor: "rgba(253,224,71,0.95)",
    pulseScale: 1.1,
    pulseDuration: 2.2,
  },
}

export function RankBadge({ rank, size = 128, intensity = 1 }: Props) {
  const tier = tiers[rank] ?? tiers.Bronze
  const reduceMotion = useReducedMotion()

  // Le flou est proportionnel à la taille du badge : un flou fixe en px
  // (pensé pour 128px) écraserait un petit badge de 28px au lieu de lui
  // faire une aura discrète.
  const primaryBlur = Math.max(5, size * 0.14)
  const secondaryBlur = Math.max(8, size * 0.2)
  const ringGlow = Math.max(3, size * 0.06)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0" style={{ opacity: intensity }}>
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: "-25%",
            background: `radial-gradient(circle, ${tier.glow}, transparent 70%)`,
            filter: `blur(${primaryBlur}px)`,
          }}
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.6, 1, 0.6], scale: [1, tier.pulseScale, 1] }
          }
          transition={{ duration: tier.pulseDuration, repeat: Infinity, ease: "easeInOut" }}
        />

        {tier.glowSecondary && (
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: "-38%",
              background: `radial-gradient(circle, ${tier.glowSecondary}, transparent 72%)`,
              filter: `blur(${secondaryBlur}px)`,
            }}
            animate={
              reduceMotion
                ? undefined
                : { opacity: [0.4, 0.85, 0.4], scale: [1, tier.pulseScale + 0.03, 1] }
            }
            transition={{ duration: tier.pulseDuration * 1.3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {tier.ring && (
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: "-18%",
              background: `conic-gradient(from 0deg, transparent, ${tier.ringColor ?? tier.glow}, transparent 50%)`,
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))",
              filter: `drop-shadow(0 0 ${ringGlow}px ${tier.ringColor ?? tier.glow})`,
            }}
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: tier.pulseDuration * 3, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      <Image
        src={tier.src}
        alt={rank}
        width={200}
        height={200}
        className="relative z-10 h-full w-full object-contain"
        priority
      />
    </div>
  )
}
