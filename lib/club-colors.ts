const PALETTE = [
  { bg: "linear-gradient(135deg, #c084fc, #7c3aed)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #f87171, #dc2626)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #60a5fa, #2563eb)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #34d399, #059669)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #fbbf24, #d97706)", text: "#ffffff" },
]

export function clubInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "??"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function clubColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}
