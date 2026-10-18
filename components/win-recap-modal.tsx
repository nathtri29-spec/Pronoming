"use client"

import Image from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Check, X } from "lucide-react"

export type WonRecapItem = {
  id: number
  status: "won" | "lost"
  matchLabel: string
  ratingDelta: number | null
  gain: number
}

type Props = {
  wins: WonRecapItem[] | null
  onClose: () => void
}

export function WinRecapModal({ wins, onClose }: Props) {
  const reduceMotion = useReducedMotion()
  const visible = !!wins && wins.length > 0

  const totalGain = wins?.reduce((sum, w) => sum + w.gain, 0) ?? 0
  const totalPr = wins?.reduce((sum, w) => sum + (w.ratingDelta ?? 0), 0) ?? 0
  const winCount = wins?.filter((w) => w.status === "won").length ?? 0
  const lossCount = (wins?.length ?? 0) - winCount
  const mascotSrc = winCount >= lossCount ? "/mascot/mascot_win.png" : "/mascot/mascot_lose.png"

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/85 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              key={mascotSrc}
              src={mascotSrc}
              alt="Mascotte Pronoming"
              width={200}
              height={200}
              className="h-[170px] w-auto object-contain"
            />
          </motion.div>

          <motion.div
            className="mt-1 w-full max-w-sm rounded-3xl border border-purple-500 bg-zinc-950 p-6 text-center shadow-[0_0_40px_rgba(168,85,247,0.5)]"
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.6, delay: 0.1 }}
          >
            <p className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Pendant ton absence...
            </p>

            <p
              className="mt-1 text-2xl font-extrabold"
              style={{
                backgroundImage: "linear-gradient(to right, #c084fc, #dc2626)",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              {wins?.length} prono{(wins?.length ?? 0) > 1 ? "s" : ""} résolu{(wins?.length ?? 0) > 1 ? "s" : ""}
            </p>

            <p className="mt-1 text-sm font-bold text-zinc-400">
              {winCount} gagné{winCount > 1 ? "s" : ""} / {(wins?.length ?? 0) - winCount} perdu
              {(wins?.length ?? 0) - winCount > 1 ? "s" : ""}
            </p>

            <div className="mt-4 max-h-[30vh] space-y-2 overflow-y-auto text-left">
              {wins?.map((w) => {
                const isWon = w.status === "won"
                const color = isWon ? "text-green-400" : "text-red-400"

                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {isWon ? (
                        <Check className="h-4 w-4 shrink-0 text-green-400" strokeWidth={3} />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-red-400" strokeWidth={3} />
                      )}
                      <span className="truncate text-sm font-bold text-white">{w.matchLabel}</span>
                    </div>
                    <span className={`shrink-0 text-sm font-black ${color}`}>
                      {w.gain > 0 ? "+" : ""}
                      {w.gain} pts
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-sm font-bold">
              <span className={totalGain >= 0 ? "text-green-400" : "text-red-400"}>
                {totalGain > 0 ? "+" : ""}
                {totalGain} points
              </span>
              {totalPr !== 0 && (
                <span className={totalPr > 0 ? "text-purple-300" : "text-red-400"}>
                  {totalPr > 0 ? "+" : ""}
                  {totalPr} PR
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-purple-600 to-red-600 py-3 font-bold text-white"
            >
              Super !
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
