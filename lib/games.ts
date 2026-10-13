export const GAMES = [
  "Rocket League",
  "Valorant",
  "League of Legends",
  "CS2",
  "Overwatch 2",
] as const

export type Game = (typeof GAMES)[number]
