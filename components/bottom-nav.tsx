"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {House,Trophy,User,Store} from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/leaderboard", label: "Classement", icon: Trophy },
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/profile", label: "Profile", icon: User },
]
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black">
      <div className="mx-auto flex max-w-md justify-around">
        {items.map((item) => {
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-bold tracking-wider ${
                active ? "text-purple-400" : "text-zinc-500"
              }`}
            >
              <item.icon
  size={20}
  strokeWidth={2.5}
/>
              <span>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}