"use client"

import { useEffect, useState } from "react"
import { useMotionValue, useTransform, animate } from "framer-motion"

export function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(value)
  const rounded = useTransform(motionValue, (v) => Math.round(v).toLocaleString("fr-FR"))
  const [display, setDisplay] = useState(rounded.get())

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.6, ease: "easeOut" })
    const unsubscribe = rounded.on("change", setDisplay)
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value])

  return <span>{display}</span>
}
