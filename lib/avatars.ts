import {
  BlackHoleSvg,
  QuantumSvg,
  NebulaSvg,
  NeuralSvg,
  PulsarSvg,
  HologramSvg,
  DarkMatterSvg,
  SatelliteSvg,
} from "@/components/avatar-svgs"

export type AvatarEmblem = {
  Svg: typeof BlackHoleSvg
  label: string
  bg: string
  glow: string
}

export const avatarEmblems: Record<string, AvatarEmblem> = {
  blackhole: {
    Svg: BlackHoleSvg,
    label: "Black Hole",
    bg: "radial-gradient(circle at 40% 38%, #0a0020, #000004)",
    glow: "0 0 30px rgba(139,92,246,.7), 0 0 12px rgba(88,28,220,.5), inset 0 1px 0 rgba(196,181,253,.08)",
  },
  quantum: {
    Svg: QuantumSvg,
    label: "Quantum",
    bg: "radial-gradient(circle at 38% 35%, #001a10, #000806)",
    glow: "0 0 28px rgba(16,185,129,.65), 0 0 10px rgba(5,150,105,.4), inset 0 1px 0 rgba(110,231,183,.08)",
  },
  nebula: {
    Svg: NebulaSvg,
    label: "Nebula",
    bg: "radial-gradient(circle at 40% 35%, #100018, #030008)",
    glow: "0 0 28px rgba(244,114,182,.6), 0 0 10px rgba(192,132,252,.4), inset 0 1px 0 rgba(249,168,212,.08)",
  },
  neural: {
    Svg: NeuralSvg,
    label: "Neural",
    bg: "radial-gradient(circle at 38% 35%, #001020, #000408)",
    glow: "0 0 28px rgba(56,189,248,.65), 0 0 10px rgba(14,165,233,.4), inset 0 1px 0 rgba(186,230,253,.08)",
  },
  pulsar: {
    Svg: PulsarSvg,
    label: "Pulsar",
    bg: "radial-gradient(circle at 40% 35%, #100800, #040200)",
    glow: "0 0 30px rgba(251,191,36,.65), 0 0 12px rgba(245,158,11,.4), inset 0 1px 0 rgba(254,240,138,.08)",
  },
  hologram: {
    Svg: HologramSvg,
    label: "Hologram",
    bg: "radial-gradient(circle at 38% 35%, #001818, #000606)",
    glow: "0 0 28px rgba(20,184,166,.65), 0 0 10px rgba(13,148,136,.4), inset 0 1px 0 rgba(94,234,212,.08)",
  },
  darkmatter: {
    Svg: DarkMatterSvg,
    label: "Dark Matter",
    bg: "radial-gradient(circle at 38% 35%, #080010, #020004)",
    glow: "0 0 28px rgba(167,139,250,.6), 0 0 10px rgba(124,58,237,.4), inset 0 1px 0 rgba(221,214,254,.06)",
  },
  satellite: {
    Svg: SatelliteSvg,
    label: "Satellite",
    bg: "radial-gradient(circle at 38% 35%, #0a0a14, #020208)",
    glow: "0 0 28px rgba(148,163,184,.5), 0 0 10px rgba(100,116,139,.35), inset 0 1px 0 rgba(226,232,240,.06)",
  },
}

export const avatarKeys = Object.keys(avatarEmblems)
