"use client"

import type { ReactNode } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { PageTransition } from "@/components/page-transition"

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageTransition>{children}</PageTransition>
      <BottomNav />
    </>
  )
}
