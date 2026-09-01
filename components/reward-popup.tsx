"use client"

import type { ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"

type Props = {
  visible: boolean
  icon: ReactNode
  title: string
  subtitle?: string
}

const particles = Array.from({ length: 8 }, (_, i) => i)

export function RewardPopup({ visible, icon, title, subtitle }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="relative rounded-3xl border border-purple-500 bg-zinc-950 px-8 py-6 text-center shadow-[0_0_40px_rgba(168,85,247,0.6)]"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
          >
            {particles.map((i) => {
              const angle = (i / particles.length) * Math.PI * 2
              const distance = 70
              return (
                <motion.span
                  key={i}
                  className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-gradient-to-br from-purple-400 to-red-400"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
                />
              )
            })}

            <motion.div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-red-600 shadow-[0_0_30px_rgba(168,85,247,0.5)]"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.5, delay: 0.1 }}
            >
              {icon}
            </motion.div>

            <p className="mt-3 text-xl font-extrabold text-white">{title}</p>
            {subtitle && <p className="mt-1 text-sm font-bold text-purple-300">{subtitle}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
