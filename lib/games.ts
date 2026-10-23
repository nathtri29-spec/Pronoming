export const GAMES = [
  "Rocket League",
  "Valorant",
  "League of Legends",
  "CS2",
] as const

export type Game = (typeof GAMES)[number]
