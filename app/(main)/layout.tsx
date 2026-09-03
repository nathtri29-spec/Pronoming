"use client"

import type { ReactNode } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { PageTransition } from "@/components/page-transition"
import { ProfileProvider } from "@/components/profile-provider"

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <PageTransition>{children}</PageTransition>
      <BottomNav />
    </ProfileProvider>
  )
}
