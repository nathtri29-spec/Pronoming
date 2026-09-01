"use client"

import { motion } from "framer-motion"

type Props = {
  progress: number
}

export function XpBar({ progress }: Props) {
  const clamped = Math.min(Math.max(progress, 0), 100)

  return (
    <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
      <motion.div
        className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-300"
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ type: "spring", bounce: 0, duration: 0.9 }}
      />
    </div>
  )
}
