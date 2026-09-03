"use client"

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, XCircle } from "lucide-react"

type ToastType = "success" | "error"

type ToastItem = {
  id: number
  type: ToastType
  message: string
}

type ToastContextValue = {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const push = useCallback((type: ToastType, message: string) => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, type, message }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const value: ToastContextValue = {
    success: (message) => push("success", message),
    error: (message) => push("error", message),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
                toast.type === "success"
                  ? "border-green-500/40 bg-green-950/90 text-green-300"
                  : "border-red-500/40 bg-red-950/90 text-red-300"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              )}
              <p className="text-sm font-bold">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)

  if (!ctx) {
    throw new Error("useToast doit etre utilise a l'interieur d'un ToastProvider")
  }

  return ctx
}
