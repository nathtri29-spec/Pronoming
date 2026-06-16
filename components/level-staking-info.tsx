"use client"

import { Info, Lock, Unlock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LevelTier {
  level: number
  maxWager: number
  unlocked: boolean
}

interface LevelStakingInfoProps {
  currentLevel: number
}

export function LevelStakingInfo({ currentLevel }: LevelStakingInfoProps) {
  const tiers: LevelTier[] = [
    { level: 1, maxWager: 10, unlocked: currentLevel >= 1 },
    { level: 5, maxWager: 12, unlocked: currentLevel >= 5 },
    { level: 10, maxWager: 15, unlocked: currentLevel >= 10 },
    { level: 20, maxWager: 18, unlocked: currentLevel >= 20 },
    { level: 30, maxWager: 20, unlocked: currentLevel >= 30 },
  ]

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4 text-primary" />
          Level Staking System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Higher levels unlock increased maximum wager percentages. Progress through levels by making accurate predictions.
        </p>
        
        <div className="space-y-2">
          {tiers.map((tier, index) => (
            <div
              key={tier.level}
              className={`flex items-center justify-between rounded-lg border p-2.5 transition-colors ${
                tier.unlocked 
                  ? "border-primary/30 bg-primary/5" 
                  : "border-border/30 bg-muted/30"
              }`}
            >
              <div className="flex items-center gap-2">
                {tier.unlocked ? (
                  <Unlock className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={`text-sm font-medium ${
                  tier.unlocked ? "text-foreground" : "text-muted-foreground"
                }`}>
                  Level {tier.level}
                  {currentLevel >= tier.level && currentLevel < (tiers[index + 1]?.level ?? Infinity) && (
                    <span className="ml-2 text-xs text-primary">(Current)</span>
                  )}
                </span>
              </div>
              <span className={`text-sm font-bold ${
                tier.unlocked ? "text-primary" : "text-muted-foreground"
              }`}>
                Max {tier.maxWager}%
              </span>
            </div>
          ))}
        </div>

        <p className="pt-1 text-center text-xs text-muted-foreground">
          Maximum cap: <span className="font-semibold text-accent">20%</span>
        </p>
      </CardContent>
    </Card>
  )
}
