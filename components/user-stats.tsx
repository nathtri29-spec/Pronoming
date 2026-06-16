"use client"

import { Coins, Zap, TrendingUp, Percent } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  subValue?: string
  progress?: number
  accentColor?: "primary" | "accent"
}

function StatCard({ icon, label, value, subValue, progress, accentColor = "primary" }: StatCardProps) {
  const glowClass = accentColor === "accent" 
    ? "shadow-accent/20" 
    : "shadow-primary/20"
  
  const iconBgClass = accentColor === "accent"
    ? "bg-accent/10 text-accent"
    : "bg-primary/10 text-primary"

  return (
    <Card className={`relative overflow-hidden border-border/50 bg-card/50 backdrop-blur shadow-lg ${glowClass}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${accentColor === "accent" ? "from-accent/5" : "from-primary/5"} to-transparent`} />
      <CardContent className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 truncate text-2xl font-bold text-foreground">
              {value}
            </p>
            {subValue && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subValue}</p>
            )}
            {progress !== undefined && (
              <div className="mt-2">
                <Progress 
                  value={progress} 
                  className="h-1.5 bg-secondary"
                />
              </div>
            )}
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface UserStatsProps {
  points: number
  xp: number
  xpToNextLevel: number
  level: number
  maxWagerPercent: number
}

export function UserStats({ points, xp, xpToNextLevel, level, maxWagerPercent }: UserStatsProps) {
  const xpProgress = (xp / xpToNextLevel) * 100

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Your Stats</h2>
        <span className="text-xs text-muted-foreground">Season 1</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Coins className="h-5 w-5" />}
          label="Points"
          value={String(points)}
          accentColor="accent"
        />
        <StatCard
          icon={<Zap className="h-5 w-5" />}
          label="XP"
          value={xp.toString()}
          subValue={`${xpToNextLevel - xp} to next level`}
          progress={xpProgress}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Level"
          value={level.toString()}
          subValue="Rising Star"
        />
        <StatCard
          icon={<Percent className="h-5 w-5" />}
          label="Max Wager"
          value={`${maxWagerPercent}%`}
          accentColor="accent"
        />
      </div>
    </section>
  )
}
