"use client"

import { useId } from "react"

type SvgProps = { size?: number }

export function BlackHoleSvg({ size = 40 }: SvgProps) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <defs>
        <radialGradient id={`${uid}-bh1`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" />
          <stop offset="40%" stopColor="#0d0025" />
          <stop offset="70%" stopColor="#1a0050" />
          <stop offset="100%" stopColor="#2e0080" />
        </radialGradient>
        <radialGradient id={`${uid}-bh2`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(139,92,246,0)" />
          <stop offset="60%" stopColor="rgba(139,92,246,.15)" />
          <stop offset="100%" stopColor="rgba(139,92,246,.4)" />
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="30" rx="26" ry="8" fill="none" stroke="#7c3aed" strokeWidth="3.5" opacity=".25" transform="rotate(-20 30 30)" />
      <ellipse cx="30" cy="30" rx="26" ry="8" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity=".4" transform="rotate(-20 30 30)" />
      <ellipse cx="30" cy="30" rx="22" ry="6" fill="none" stroke="#c4b5fd" strokeWidth=".8" opacity=".3" transform="rotate(-20 30 30)" />
      <ellipse cx="30" cy="30" rx="18" ry="5" fill="none" stroke="#ddd6fe" strokeWidth=".6" opacity=".35" transform="rotate(-20 30 30)" />
      <path d="M6 24 Q18 18 30 22 Q42 18 54 24" stroke="#e879f9" strokeWidth="1.5" fill="none" opacity=".5" />
      <path d="M8 22 Q20 17 30 20 Q40 17 52 22" stroke="#f0abfc" strokeWidth=".8" fill="none" opacity=".4" />
      <circle cx="30" cy="30" r="16" fill={`url(#${uid}-bh1)`} />
      <circle cx="30" cy="30" r="16" fill={`url(#${uid}-bh2)`} />
      <circle cx="30" cy="30" r="13" fill="none" stroke="#a78bfa" strokeWidth=".8" opacity=".6" />
      <circle cx="30" cy="30" r="11" fill="none" stroke="#7c3aed" strokeWidth=".5" opacity=".4" />
      <circle cx="30" cy="30" r="6" fill="#000" />
      <path d="M18 20 Q14 28 16 36" stroke="rgba(196,181,253,.2)" strokeWidth=".8" fill="none" />
      <path d="M42 20 Q46 28 44 36" stroke="rgba(196,181,253,.15)" strokeWidth=".8" fill="none" />
      <circle cx="8" cy="10" r=".8" fill="#c4b5fd" opacity=".7" />
      <circle cx="52" cy="8" r=".6" fill="#e879f9" opacity=".6" />
      <circle cx="6" cy="48" r=".7" fill="#a78bfa" opacity=".5" />
      <circle cx="54" cy="50" r=".9" fill="#c4b5fd" opacity=".6" />
      <circle cx="14" cy="52" r=".5" fill="white" opacity=".4" />
      <circle cx="48" cy="14" r=".6" fill="white" opacity=".5" />
    </svg>
  )
}

export function QuantumSvg({ size = 40 }: SvgProps) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <defs>
        <linearGradient id={`${uid}-cpu1`} x1="14" y1="14" x2="46" y2="46">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="40%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#022c1a" />
        </linearGradient>
        <linearGradient id={`${uid}-cpu2`} x1="14" y1="14" x2="46" y2="46">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
      </defs>
      <line x1="20" y1="8" x2="20" y2="14" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      <line x1="28" y1="6" x2="28" y2="14" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      <line x1="36" y1="8" x2="36" y2="14" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      <line x1="44" y1="8" x2="44" y2="14" stroke="#6ee7b7" strokeWidth="1.2" strokeLinecap="round" opacity=".6" />
      <line x1="20" y1="52" x2="20" y2="46" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      <line x1="28" y1="54" x2="28" y2="46" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      <line x1="36" y1="52" x2="36" y2="46" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      <line x1="44" y1="52" x2="44" y2="46" stroke="#6ee7b7" strokeWidth="1.2" strokeLinecap="round" opacity=".6" />
      <line x1="8" y1="20" x2="14" y2="20" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      <line x1="6" y1="28" x2="14" y2="28" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      <line x1="8" y1="36" x2="14" y2="36" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      <line x1="8" y1="44" x2="14" y2="44" stroke="#6ee7b7" strokeWidth="1.2" strokeLinecap="round" opacity=".6" />
      <line x1="52" y1="20" x2="46" y2="20" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      <line x1="54" y1="28" x2="46" y2="28" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      <line x1="52" y1="36" x2="46" y2="36" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      <line x1="52" y1="44" x2="46" y2="44" stroke="#6ee7b7" strokeWidth="1.2" strokeLinecap="round" opacity=".6" />
      <rect x="14" y="14" width="32" height="32" rx="4" fill={`url(#${uid}-cpu1)`} stroke="#6ee7b7" strokeWidth=".8" />
      <rect x="14" y="14" width="32" height="32" rx="4" fill="rgba(0,0,0,.25)" />
      <path d="M16 15 Q30 13 44 16 Q34 20 16 20Z" fill="rgba(167,243,208,.25)" />
      <line x1="22" y1="14" x2="22" y2="46" stroke="rgba(16,185,129,.3)" strokeWidth=".6" />
      <line x1="30" y1="14" x2="30" y2="46" stroke="rgba(16,185,129,.3)" strokeWidth=".6" />
      <line x1="38" y1="14" x2="38" y2="46" stroke="rgba(16,185,129,.3)" strokeWidth=".6" />
      <line x1="14" y1="22" x2="46" y2="22" stroke="rgba(16,185,129,.3)" strokeWidth=".6" />
      <line x1="14" y1="30" x2="46" y2="30" stroke="rgba(16,185,129,.3)" strokeWidth=".6" />
      <line x1="14" y1="38" x2="46" y2="38" stroke="rgba(16,185,129,.3)" strokeWidth=".6" />
      <rect x="22" y="22" width="16" height="16" rx="2" fill={`url(#${uid}-cpu2)`} stroke="#a7f3d0" strokeWidth=".6" />
      <rect x="22" y="22" width="16" height="16" rx="2" fill="rgba(0,0,0,.2)" />
      <rect x="25" y="25" width="10" height="10" rx="1" fill="none" stroke="#6ee7b7" strokeWidth=".7" opacity=".8" />
      <circle cx="30" cy="30" r="2.5" fill="#a7f3d0" opacity=".9" />
      <circle cx="30" cy="30" r="1" fill="#fff" opacity=".8" />
    </svg>
  )
}

export function NebulaSvg({ size = 40 }: SvgProps) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <defs>
        <radialGradient id={`${uid}-nb1`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fdf4ff" />
          <stop offset="20%" stopColor="#e879f9" />
          <stop offset="55%" stopColor="#a21caf" />
          <stop offset="100%" stopColor="#1a003a" />
        </radialGradient>
        <radialGradient id={`${uid}-nb2`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="30%" stopColor="#f9a8d4" />
          <stop offset="70%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#05001a" />
        </radialGradient>
      </defs>
      <ellipse cx="22" cy="24" rx="14" ry="10" fill="#7e22ce" opacity=".2" />
      <ellipse cx="38" cy="36" rx="12" ry="9" fill="#be185d" opacity=".18" />
      <ellipse cx="30" cy="30" rx="10" ry="14" fill="#6d28d9" opacity=".15" />
      <path d="M4 30 Q18 12 30 10 Q42 12 56 30 Q42 48 30 50 Q18 48 4 30Z" fill={`url(#${uid}-nb2)`} opacity=".15" />
      <path d="M8 30 Q20 14 30 12 Q40 14 52 30 Q40 46 30 48 Q20 46 8 30Z" fill={`url(#${uid}-nb1)`} />
      <line x1="30" y1="14" x2="30" y2="20" stroke="rgba(255,255,255,.3)" strokeWidth=".7" />
      <line x1="40" y1="16" x2="37" y2="21" stroke="rgba(255,255,255,.25)" strokeWidth=".7" />
      <line x1="48" y1="24" x2="43" y2="26" stroke="rgba(255,255,255,.25)" strokeWidth=".7" />
      <line x1="48" y1="36" x2="43" y2="34" stroke="rgba(255,255,255,.25)" strokeWidth=".7" />
      <line x1="40" y1="44" x2="37" y2="39" stroke="rgba(255,255,255,.25)" strokeWidth=".7" />
      <line x1="30" y1="46" x2="30" y2="40" stroke="rgba(255,255,255,.3)" strokeWidth=".7" />
      <line x1="20" y1="44" x2="23" y2="39" stroke="rgba(255,255,255,.25)" strokeWidth=".7" />
      <line x1="12" y1="36" x2="17" y2="34" stroke="rgba(255,255,255,.25)" strokeWidth=".7" />
      <line x1="12" y1="24" x2="17" y2="26" stroke="rgba(255,255,255,.25)" strokeWidth=".7" />
      <line x1="20" y1="16" x2="23" y2="21" stroke="rgba(255,255,255,.25)" strokeWidth=".7" />
      <circle cx="30" cy="30" r="10" fill="#05001a" />
      <circle cx="30" cy="30" r="10" fill="none" stroke="#e879f9" strokeWidth=".6" opacity=".5" />
      <circle cx="26" cy="27" r=".8" fill="white" opacity=".7" />
      <circle cx="33" cy="26" r=".5" fill="#f0abfc" opacity=".8" />
      <circle cx="28" cy="33" r=".6" fill="white" opacity=".6" />
      <circle cx="34" cy="32" r=".4" fill="#c4b5fd" opacity=".7" />
      <circle cx="30" cy="30" r="3" fill="#6d28d9" opacity=".6" />
      <circle cx="30" cy="30" r="1.2" fill="#e879f9" opacity=".8" />
      <ellipse cx="20" cy="22" rx="4" ry="2.5" fill="rgba(255,255,255,.2)" transform="rotate(-25 20 22)" />
      <ellipse cx="17" cy="21" rx="1.5" ry="1" fill="rgba(255,255,255,.45)" transform="rotate(-25 17 21)" />
      <path d="M8 30 Q20 14 30 12 Q40 14 52 30" fill="none" stroke="rgba(249,168,212,.3)" strokeWidth=".8" />
      <path d="M8 30 Q20 46 30 48 Q40 46 52 30" fill="none" stroke="rgba(192,132,252,.2)" strokeWidth=".8" />
    </svg>
  )
}

export function NeuralSvg({ size = 40 }: SvgProps) {
  const uid = useId()
  const nodes: [number, number][] = [
    [10, 12],
    [30, 6],
    [50, 12],
    [54, 30],
    [50, 48],
    [30, 54],
    [10, 48],
    [6, 30],
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <defs>
        <radialGradient id={`${uid}-nn1`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="40%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#001a2e" />
        </radialGradient>
      </defs>
      {nodes.map(([x, y], i) => (
        <line key={`spoke-${i}`} x1="30" y1="30" x2={x} y2={y} stroke={i % 2 === 0 ? "#0ea5e9" : "#38bdf8"} strokeWidth=".8" opacity=".5" />
      ))}
      {nodes.map(([x, y], i) => {
        const [nx, ny] = nodes[(i + 1) % nodes.length]
        return <line key={`ring-${i}`} x1={x} y1={y} x2={nx} y2={ny} stroke="#0ea5e9" strokeWidth=".5" opacity=".3" />
      })}
      <circle cx="30" cy="30" r="9" fill={`url(#${uid}-nn1)`} />
      <circle cx="30" cy="30" r="9" fill="rgba(0,0,0,.2)" />
      <circle cx="30" cy="30" r="6" fill="none" stroke="#7dd3fc" strokeWidth=".7" opacity=".7" />
      <circle cx="30" cy="30" r="3" fill="#e0f2fe" opacity=".9" />
      <circle cx="28.5" cy="28.5" r="1.2" fill="white" opacity=".7" />
      {nodes.map(([x, y], i) => (
        <circle key={`node-${i}`} cx={x} cy={y} r="3.5" fill="#0c4a6e" stroke="#38bdf8" strokeWidth=".8" />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={`glow-${i}`} cx={x} cy={y} r="1.5" fill="#7dd3fc" opacity=".9" />
      ))}
    </svg>
  )
}

export function PulsarSvg({ size = 40 }: SvgProps) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <defs>
        <radialGradient id={`${uid}-ps1`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="25%" stopColor="#fde047" />
          <stop offset="55%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#1c0a00" />
        </radialGradient>
        <radialGradient id={`${uid}-ps2`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="30%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="rgba(202,138,4,0)" />
        </radialGradient>
      </defs>
      <circle cx="30" cy="30" r="26" fill="none" stroke="#ca8a04" strokeWidth=".6" opacity=".2" />
      <circle cx="30" cy="30" r="22" fill="none" stroke="#ca8a04" strokeWidth=".6" opacity=".25" />
      <circle cx="30" cy="30" r="18" fill="none" stroke="#eab308" strokeWidth=".7" opacity=".3" />
      <circle cx="30" cy="30" r="14" fill="none" stroke="#fbbf24" strokeWidth=".8" opacity=".4" />
      <line x1="30" y1="4" x2="30" y2="16" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" opacity=".9" />
      <line x1="30" y1="56" x2="30" y2="44" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" opacity=".9" />
      <line x1="30" y1="6" x2="30" y2="14" stroke="white" strokeWidth="1" strokeLinecap="round" opacity=".7" />
      <line x1="30" y1="54" x2="30" y2="46" stroke="white" strokeWidth="1" strokeLinecap="round" opacity=".7" />
      <path d="M27 6 Q30 4 33 6" stroke="#fef08a" strokeWidth=".8" fill="none" opacity=".5" />
      <path d="M27 54 Q30 56 33 54" stroke="#fef08a" strokeWidth=".8" fill="none" opacity=".5" />
      <circle cx="30" cy="30" r="10" fill={`url(#${uid}-ps1)`} />
      <circle cx="30" cy="30" r="10" fill="rgba(0,0,0,.15)" />
      <circle cx="26" cy="27" r="1.5" fill="rgba(0,0,0,.3)" stroke="#fde047" strokeWidth=".4" />
      <circle cx="34" cy="28" r="1.2" fill="rgba(0,0,0,.3)" stroke="#fde047" strokeWidth=".4" />
      <circle cx="29" cy="34" r="1" fill="rgba(0,0,0,.25)" stroke="#fde047" strokeWidth=".4" />
      <circle cx="30" cy="30" r="4" fill={`url(#${uid}-ps2)`} opacity=".9" />
      <circle cx="28.5" cy="28.5" r="1.5" fill="white" opacity=".8" />
      <ellipse cx="30" cy="30" rx="10" ry="3" fill="none" stroke="#fbbf24" strokeWidth=".6" opacity=".4" />
    </svg>
  )
}

export function HologramSvg({ size = 40 }: SvgProps) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <defs>
        <linearGradient id={`${uid}-hg1`} x1="16" y1="6" x2="44" y2="54">
          <stop offset="0%" stopColor="#ccfbf1" />
          <stop offset="35%" stopColor="#2dd4bf" />
          <stop offset="70%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#001a16" />
        </linearGradient>
      </defs>
      <line x1="10" y1="18" x2="50" y2="18" stroke="#0d9488" strokeWidth=".5" opacity=".3" />
      <line x1="10" y1="22" x2="50" y2="22" stroke="#0d9488" strokeWidth=".5" opacity=".35" />
      <line x1="10" y1="26" x2="50" y2="26" stroke="#14b8a6" strokeWidth=".5" opacity=".3" />
      <line x1="10" y1="30" x2="50" y2="30" stroke="#14b8a6" strokeWidth=".6" opacity=".4" />
      <line x1="10" y1="34" x2="50" y2="34" stroke="#0d9488" strokeWidth=".5" opacity=".3" />
      <line x1="10" y1="38" x2="50" y2="38" stroke="#0d9488" strokeWidth=".5" opacity=".35" />
      <line x1="10" y1="42" x2="50" y2="42" stroke="#0d9488" strokeWidth=".5" opacity=".3" />
      <path
        d="M30 10 Q18 12 16 24 Q14 34 18 42 Q22 48 26 50 Q28 52 30 50 Q32 52 34 50 Q38 48 42 42 Q46 34 44 24 Q42 12 30 10Z"
        fill={`url(#${uid}-hg1)`}
        opacity=".85"
      />
      <path d="M16 30 Q20 28 24 30 Q20 32 16 30Z" fill="#ccfbf1" opacity=".15" />
      <ellipse cx="23" cy="28" rx="4" ry="3.5" fill="rgba(0,30,28,.8)" />
      <ellipse cx="37" cy="28" rx="4" ry="3.5" fill="rgba(0,30,28,.8)" />
      <ellipse cx="23" cy="28" rx="2.5" ry="2.5" fill="#2dd4bf" opacity=".9" />
      <ellipse cx="37" cy="28" rx="2.5" ry="2.5" fill="#2dd4bf" opacity=".9" />
      <ellipse cx="23" cy="28" rx="1" ry="1.2" fill="#001a16" />
      <ellipse cx="37" cy="28" rx="1" ry="1.2" fill="#001a16" />
      <ellipse cx="22" cy="27" rx=".9" ry=".7" fill="rgba(255,255,255,.6)" />
      <ellipse cx="36" cy="27" rx=".9" ry=".7" fill="rgba(255,255,255,.6)" />
      <path d="M28 34 L30 32 L32 34" stroke="#0d9488" strokeWidth=".8" fill="none" strokeLinecap="round" />
      <path d="M24 40 Q30 44 36 40" stroke="#2dd4bf" strokeWidth=".8" fill="none" strokeLinecap="round" opacity=".8" />
      <path d="M20 14 Q30 10 40 14" stroke="rgba(204,251,241,.4)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <rect x="10" y="26" width="4" height="1" rx=".5" fill="#2dd4bf" opacity=".5" />
      <rect x="46" y="32" width="4" height="1" rx=".5" fill="#2dd4bf" opacity=".4" />
      <rect x="8" y="36" width="3" height="1" rx=".5" fill="#14b8a6" opacity=".4" />
      <circle cx="12" cy="20" r=".8" fill="#2dd4bf" opacity=".5" />
      <circle cx="50" cy="24" r=".7" fill="#2dd4bf" opacity=".4" />
    </svg>
  )
}

export function DarkMatterSvg({ size = 40 }: SvgProps) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <defs>
        <radialGradient id={`${uid}-dm1`} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="30%" stopColor="#8b5cf6" />
          <stop offset="70%" stopColor="#4c1d95" />
          <stop offset="100%" stopColor="#050010" />
        </radialGradient>
      </defs>
      <path d="M30 30 Q40 10 54 14 Q46 28 30 30Z" fill="#4c1d95" opacity=".5" />
      <path d="M30 30 Q50 36 50 50 Q36 44 30 30Z" fill="#5b21b6" opacity=".4" />
      <path d="M30 30 Q20 50 6 46 Q14 32 30 30Z" fill="#4c1d95" opacity=".5" />
      <path d="M30 30 Q10 24 10 10 Q24 16 30 30Z" fill="#5b21b6" opacity=".4" />
      <path d="M30 30 Q38 22 46 10" stroke="#8b5cf6" strokeWidth="1.5" fill="none" opacity=".6" strokeLinecap="round" />
      <path d="M30 30 Q44 34 50 46" stroke="#7c3aed" strokeWidth="1.2" fill="none" opacity=".5" strokeLinecap="round" />
      <path d="M30 30 Q22 38 14 50" stroke="#8b5cf6" strokeWidth="1.5" fill="none" opacity=".6" strokeLinecap="round" />
      <path d="M30 30 Q16 26 10 14" stroke="#7c3aed" strokeWidth="1.2" fill="none" opacity=".5" strokeLinecap="round" />
      <circle cx="30" cy="30" r="10" fill={`url(#${uid}-dm1)`} />
      <circle cx="30" cy="30" r="10" fill="rgba(0,0,0,.2)" />
      <circle cx="44" cy="14" r="1.2" fill="#c4b5fd" opacity=".8" />
      <circle cx="38" cy="20" r=".8" fill="#ddd6fe" opacity=".7" />
      <circle cx="48" cy="44" r="1" fill="#a78bfa" opacity=".7" />
      <circle cx="42" cy="38" r=".7" fill="#c4b5fd" opacity=".6" />
      <circle cx="16" cy="46" r="1.2" fill="#c4b5fd" opacity=".8" />
      <circle cx="22" cy="40" r=".8" fill="#ddd6fe" opacity=".7" />
      <circle cx="12" cy="16" r="1" fill="#a78bfa" opacity=".7" />
      <circle cx="18" cy="22" r=".7" fill="#c4b5fd" opacity=".6" />
      <circle cx="30" cy="30" r="5" fill="#ede9fe" opacity=".3" />
      <circle cx="30" cy="30" r="2.5" fill="#ede9fe" opacity=".8" />
      <circle cx="29" cy="29" r="1" fill="white" opacity=".9" />
    </svg>
  )
}

export function SatelliteSvg({ size = 40 }: SvgProps) {
  const uid = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <defs>
        <linearGradient id={`${uid}-sat1`} x1="10" y1="10" x2="50" y2="50">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="35%" stopColor="#94a3b8" />
          <stop offset="70%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={`${uid}-sat2`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id={`${uid}-pan1`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <g transform="rotate(-35 30 30)">
        <rect x="20" y="22" width="20" height="16" rx="3" fill={`url(#${uid}-sat1)`} />
        <rect x="20" y="22" width="20" height="16" rx="3" fill="rgba(0,0,0,.25)" />
        <rect x="20" y="22" width="20" height="16" rx="3" fill={`url(#${uid}-sat2)`} opacity=".6" />
        <rect x="2" y="26" width="14" height="8" rx="1.5" fill={`url(#${uid}-pan1)`} />
        <rect x="2" y="26" width="14" height="8" rx="1.5" fill="none" stroke="#3b82f6" strokeWidth=".6" />
        <line x1="6" y1="26" x2="6" y2="34" stroke="#1d4ed8" strokeWidth=".5" opacity=".6" />
        <line x1="9" y1="26" x2="9" y2="34" stroke="#1d4ed8" strokeWidth=".5" opacity=".6" />
        <line x1="12" y1="26" x2="12" y2="34" stroke="#1d4ed8" strokeWidth=".5" opacity=".6" />
        <rect x="2" y="26" width="14" height="3" rx="1" fill="rgba(147,197,253,.25)" />
        <rect x="44" y="26" width="14" height="8" rx="1.5" fill={`url(#${uid}-pan1)`} />
        <rect x="44" y="26" width="14" height="8" rx="1.5" fill="none" stroke="#3b82f6" strokeWidth=".6" />
        <line x1="48" y1="26" x2="48" y2="34" stroke="#1d4ed8" strokeWidth=".5" opacity=".6" />
        <line x1="51" y1="26" x2="51" y2="34" stroke="#1d4ed8" strokeWidth=".5" opacity=".6" />
        <line x1="54" y1="26" x2="54" y2="34" stroke="#1d4ed8" strokeWidth=".5" opacity=".6" />
        <rect x="44" y="26" width="14" height="3" rx="1" fill="rgba(147,197,253,.25)" />
        <line x1="30" y1="30" x2="30" y2="10" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
        <circle cx="30" cy="10" r="2" fill="#e2e8f0" />
        <path d="M34 8 Q38 6 38 10 Q38 14 34 12" stroke="#60a5fa" strokeWidth=".7" fill="none" opacity=".6" />
        <path d="M36 6 Q42 4 42 10 Q42 16 36 14" stroke="#3b82f6" strokeWidth=".6" fill="none" opacity=".4" />
        <circle cx="22" cy="24" r="1.2" fill="#64748b" stroke="#94a3b8" strokeWidth=".4" />
        <circle cx="38" cy="24" r="1.2" fill="#64748b" stroke="#94a3b8" strokeWidth=".4" />
        <circle cx="22" cy="36" r="1.2" fill="#64748b" stroke="#94a3b8" strokeWidth=".4" />
        <circle cx="38" cy="36" r="1.2" fill="#64748b" stroke="#94a3b8" strokeWidth=".4" />
      </g>
      <circle cx="8" cy="8" r=".7" fill="white" opacity=".5" />
      <circle cx="52" cy="6" r=".5" fill="white" opacity=".4" />
      <circle cx="6" cy="50" r=".6" fill="white" opacity=".4" />
      <circle cx="54" cy="52" r=".8" fill="white" opacity=".5" />
      <circle cx="50" cy="48" r=".4" fill="#93c5fd" opacity=".5" />
    </svg>
  )
}
