"use client"

import { Calendar, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Team {
  name: string
  shortName: string
  logo?: string
  odds: number
}

interface MatchCardProps {
  teamA: Team
  teamB: Team
  date: string
  time: string
  tournament?: string
  isLive?: boolean
}

export function MatchCard({ teamA, teamB, date, time, tournament, isLive }: MatchCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <CardContent className="relative p-4">
        {/* Tournament & Status */}
        <div className="mb-3 flex items-center justify-between">
          {tournament && (
            <span className="text-xs font-medium text-muted-foreground">
              {tournament}
            </span>
          )}
          {isLive && (
            <Badge variant="destructive" className="animate-pulse bg-accent text-accent-foreground">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-accent-foreground" />
              LIVE
            </Badge>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4">
          {/* Team A */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <Avatar className="h-14 w-14 border-2 border-border bg-secondary">
              <AvatarImage src={teamA.logo} alt={teamA.name} />
              <AvatarFallback className="bg-secondary text-lg font-bold text-foreground">
                {teamA.shortName}
              </AvatarFallback>
            </Avatar>
            <span className="text-center text-sm font-medium text-foreground line-clamp-1">
              {teamA.name}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-primary/50 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              {teamA.odds.toFixed(2)}
            </Button>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center gap-1 px-2">
            <span className="text-lg font-bold text-muted-foreground">VS</span>
          </div>

          {/* Team B */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <Avatar className="h-14 w-14 border-2 border-border bg-secondary">
              <AvatarImage src={teamB.logo} alt={teamB.name} />
              <AvatarFallback className="bg-secondary text-lg font-bold text-foreground">
                {teamB.shortName}
              </AvatarFallback>
            </Avatar>
            <span className="text-center text-sm font-medium text-foreground line-clamp-1">
              {teamB.name}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-accent/50 bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground"
            >
              {teamB.odds.toFixed(2)}
            </Button>
          </div>
        </div>

        {/* Date & Time */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{time}</span>
          </div>
        </div>

        {/* Predict Button */}
        <Button 
          className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
        >
          Predict
        </Button>
      </CardContent>
    </Card>
  )
}
