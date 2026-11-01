export const GAMES = [
  "Rocket League",
  "Valorant",
  "League of Legends",
  "CS2",
] as const

export type Game = (typeof GAMES)[number]

export const GAME_COLORS: Record<string, string> = {
  "Rocket League": "#0066FF",
  Valorant: "#FF4655",
  "League of Legends": "#C89B3C",
  CS2: "#E4622A",
}

export function getGameColor(game?: string | null) {
  return GAME_COLORS[game ?? "Rocket League"] ?? GAME_COLORS["Rocket League"]
}
