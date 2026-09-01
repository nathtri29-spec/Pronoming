"use client"

import { useEffect, useRef } from "react"

/**
 * Empêche la page en arrière-plan de scroller pendant qu'un panneau
 * (bottom sheet, modale) est ouvert, sans toucher à `document.body`
 * (les techniques `overflow: hidden` / `position: fixed` sur body posent
 * problème avec le clavier virtuel quand le panneau contient un champ de
 * saisie). On bloque uniquement les gestes qui commencent en dehors du
 * panneau lui-même, qui continue de scroller normalement.
 */
export function useScrollLock(active: boolean) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return

    function shouldBlock(target: EventTarget | null) {
      return !(ref.current && target instanceof Node && ref.current.contains(target))
    }

    function handleTouchMove(e: TouchEvent) {
      if (shouldBlock(e.target)) e.preventDefault()
    }

    function handleWheel(e: WheelEvent) {
      if (shouldBlock(e.target)) e.preventDefault()
    }

    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("wheel", handleWheel)
    }
  }, [active])

  return ref
}
